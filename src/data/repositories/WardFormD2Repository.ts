import { D2Api, MetadataPick } from "../../types/d2-api";
import { FormValue, Row, WardForm } from "../../domain/entities/Questionnaire/WardForm";
import { Id, NamedRef } from "../../domain/entities/Ref";
import { WardFormRepository } from "../../domain/repositories/WardFormRepository";
import { apiToFuture, FutureData } from "../api-futures";
import { Future } from "../../domain/entities/generic/Future";
import {
    PREVALENCE_FACILITY_LEVEL_FORM_ID,
    WARD_SUMMARY_STATISTICS_FORM_ID,
} from "../entities/D2Survey";
import _c from "../../domain/entities/generic/Collection";
import { Maybe } from "../../utils/ts-utils";
import { DataValue as D2DataValue } from "@eyeseetea/d2-api/api/trackerEvents";

type WardEvent = {
    formId: Id;
    wardId: string;
    specialtyCode: string;
};

type D2Event = {
    event: Id;
    programStage: Id;
    dataValues: D2DataValue[];
};

type WardSummaryDataSet = {
    name: string;
    dataElements: Array<NamedRef & { categoryOptionCombos: NamedRef[] }>;
};

export class WardFormD2Repository implements WardFormRepository {
    constructor(private api: D2Api) {}

    get(facilityId: Id, period: string): FutureData<WardForm[]> {
        return Future.joinObj(
            {
                wardEvents: this.getWardEvents(facilityId),
                dataSet: this.getWardSummaryDataSet(),
            },
            { concurrency: 2 }
        ).flatMap(({ wardEvents, dataSet }) =>
            this.getDataValues(facilityId, period, wardEvents).map(dataValues =>
                this.mapToWardForms(wardEvents, dataValues, dataSet)
            )
        );
    }

    save(formValue: FormValue, facilityId: Id, period: string): FutureData<void> {
        return apiToFuture(
            this.api.dataValues.postSet(
                {},
                {
                    dataSet: WARD_SUMMARY_STATISTICS_FORM_ID,
                    orgUnit: facilityId,
                    period: period,
                    attributeOptionCombo: formValue.formId,
                    dataValues: [
                        {
                            dataElement: formValue.rowId,
                            categoryOptionCombo: formValue.columnId,
                            value: formValue.value ?? "",
                        },
                    ],
                }
            )
        ).flatMap(response => {
            if (response.status !== "SUCCESS")
                return Future.error(
                    new Error("Failed to save form value: " + response.description)
                );
            return Future.success(undefined);
        });
    }

    private getDataValues(
        facilityId: Id,
        period: string,
        wardEvents: WardEvent[]
    ): FutureData<FormValue[]> {
        return apiToFuture(
            this.api.dataValues.getSet({
                dataSet: [WARD_SUMMARY_STATISTICS_FORM_ID],
                orgUnit: [facilityId],
                period: [period],
                attributeOptionCombo: wardEvents.map(wardEvent => wardEvent.formId),
            })
        ).flatMap(({ dataValues }) => {
            const formValues = dataValues.map(dataValue => ({
                formId: dataValue.attributeOptionCombo,
                rowId: dataValue.dataElement,
                columnId: dataValue.categoryOptionCombo,
                value: dataValue.value,
            }));

            return Future.success(formValues);
        });
    }

    private mapToWardForms(
        wardEvents: WardEvent[],
        formValues: FormValue[],
        dataSet: WardSummaryDataSet
    ): WardForm[] {
        return _c(wardEvents)
            .compactMap(event => this.mapEventToWardForm(event, formValues, dataSet))
            .sortBy(form => form.title)
            .value();
    }

    private mapEventToWardForm(
        wardEvent: WardEvent,
        formValues: FormValue[],
        dataSet: WardSummaryDataSet
    ): Maybe<WardForm> {
        const title = `${wardEvent.wardId} - ${wardEvent.specialtyCode}`;
        const columns = dataSet.dataElements[0]?.categoryOptionCombos ?? [];
        const rows = this.getRows(wardEvent, formValues, dataSet, columns);

        return { formId: wardEvent.formId, title, columns, rows };
    }

    private getRows(
        wardEvent: WardEvent,
        formValues: FormValue[],
        dataSet: WardSummaryDataSet,
        columns: NamedRef[]
    ): Row[] {
        return _c(dataSet.dataElements)
            .map(dataElement => this.getSingleRow(dataElement, columns, wardEvent, formValues))
            .sortBy(row => row.name)
            .value();
    }

    private getSingleRow(
        dataElement: NamedRef & { categoryOptionCombos: NamedRef[] },
        columns: NamedRef[],
        wardEvent: WardEvent,
        formValues: FormValue[]
    ): Row {
        const rowItems = columns.map(column =>
            findOrCreateFormValue(dataElement.id, column.id, wardEvent.formId, formValues)
        );

        return {
            id: dataElement.id,
            name: dataElement.name,
            rowItems: rowItems,
        };
    }

    private getWardSummaryDataSet(): FutureData<WardSummaryDataSet> {
        return apiToFuture(
            this.api.metadata.get({
                dataSets: {
                    filter: { id: { eq: WARD_SUMMARY_STATISTICS_FORM_ID } },
                    fields: dataSetFields,
                },
            })
        ).flatMap(({ dataSets }) => {
            const dataSet = dataSets[0];
            if (!dataSet)
                return Future.error(new Error("Ward Summary Statistics DataSet not found"));

            return Future.success({
                name: dataSet.name,
                dataElements: dataSet.dataSetElements.map(({ dataElement }) => ({
                    id: dataElement.id,
                    name: dataElement.formName,
                    categoryOptionCombos: dataElement.categoryCombo.categoryOptionCombos.map(
                        coc => ({
                            id: coc.id,
                            name: coc.name,
                        })
                    ),
                })),
            });
        });
    }

    private getWardEvents(facilityId: Id): FutureData<WardEvent[]> {
        return Future.joinObj({
            events: this.getD2Events(facilityId),
            categoryOptionCombos: this.getWardCocs(),
        }).flatMap(({ events, categoryOptionCombos }) => {
            const wardEvents = _c(events)
                .compactMap(event => {
                    if (event.programStage !== WARD_DATA_PROGRAM_STAGE_ID) return undefined;

                    const getDataValue = (id: string) =>
                        event.dataValues.find(dv => dv.dataElement === id)?.value;

                    const uniqueWardId = getDataValue(dataElementIds.WARD_ID);
                    const specialtyCode11 = getDataValue(dataElementIds.WARD_TYPE_11);
                    const specialtyCode112 = getDataValue(dataElementIds.WARD_TYPE_112);

                    if (uniqueWardId && (specialtyCode11 || specialtyCode112)) {
                        return _c([specialtyCode11, specialtyCode112])
                            .compactMap(specialtyCode => {
                                if (!specialtyCode) return undefined;

                                const wardEventCoc = categoryOptionCombos.find(coc => {
                                    const cocNames = coc.categoryOptions.map(co => co.name);
                                    return (
                                        cocNames.includes(uniqueWardId) &&
                                        cocNames.includes(specialtyCode)
                                    );
                                });

                                if (!wardEventCoc) {
                                    console.warn(
                                        `No matching category option combo for ward event with ward ID ${uniqueWardId} and specialty code ${specialtyCode}`
                                    );
                                    return undefined;
                                }

                                return {
                                    formId: wardEventCoc.id,
                                    wardId: uniqueWardId,
                                    specialtyCode: specialtyCode,
                                };
                            })
                            .value();
                    }

                    return undefined;
                })
                .flatten()
                .value();

            return Future.success(wardEvents);
        });
    }

    private getWardCocs(): FutureData<D2CategoryOptionCombo[]> {
        return apiToFuture(
            this.api.metadata.get({
                categoryOptionCombos: {
                    fields: categoryOptionComboFields,
                    filter: {
                        "categoryCombo.id": { eq: AMR_WARD_ID_MED_SPE_CAT_COMBO_ID },
                        "categoryOptions.name": { in: generateWardIds(WARD_COUNT) },
                    },
                    paging: false,
                },
            })
        ).flatMap(({ categoryOptionCombos }) => {
            return Future.success(categoryOptionCombos);
        });
    }

    private getD2Events(facilityId: string): FutureData<D2Event[]> {
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: {
                    enrollments: {
                        events: {
                            event: true,
                            programStage: true,
                            dataValues: {
                                dataElement: true,
                                value: true,
                            },
                        },
                    },
                },
                program: PREVALENCE_FACILITY_LEVEL_FORM_ID,
                orgUnit: facilityId,
                ouMode: "SELECTED",
            })
        ).map(({ instances }) =>
            instances.flatMap(trackedEntity =>
                trackedEntity.enrollments.flatMap(enrollment => enrollment.events)
            )
        );
    }
}

function findOrCreateFormValue(
    rowId: Id,
    columnId: Id,
    formId: Id,
    formValues: FormValue[]
): FormValue {
    return (
        formValues.find(
            formValue =>
                formValue.rowId === rowId &&
                formValue.columnId === columnId &&
                formValue.formId === formId
        ) ?? {
            rowId,
            columnId,
            formId,
            value: undefined,
        }
    );
}

const dataElementIds = {
    WARD_ID: "yAA33dsnWmY",
    WARD_TYPE_11: "iowb9y894y2",
    WARD_TYPE_112: "yoctlOcQ4jK",
};
const WARD_DATA_PROGRAM_STAGE_ID = "ikaExmORX0F";
const AMR_WARD_ID_MED_SPE_CAT_COMBO_ID = "xVP6NkmUPA9";
const WARD_COUNT = 32;
const generateWardIds = (count: number): string[] =>
    Array.from({ length: count }, (_, i) => `W${String(i + 1).padStart(2, "0")}`);

const dataSetFields = {
    name: true,
    dataSetElements: {
        dataElement: {
            id: true,
            formName: true,
            categoryCombo: {
                id: true,
                categoryOptionCombos: {
                    id: true,
                    name: true,
                },
            },
        },
    },
} as const;

const categoryOptionComboFields = {
    id: true,
    categoryOptions: {
        id: true,
        name: true,
    },
} as const;

type D2CategoryOptionCombo = MetadataPick<{
    categoryOptionCombos: { fields: typeof categoryOptionComboFields };
}>["categoryOptionCombos"][number];
