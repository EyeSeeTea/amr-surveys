import { D2Api, MetadataPick } from "@eyeseetea/d2-api/2.36";
import { WardForm } from "../../domain/entities/Questionnaire/WardForm";
import { Id, NamedRef } from "../../domain/entities/Ref";
import { WardFormRepository } from "../../domain/repositories/WardFormRepository";
import { apiToFuture, FutureData } from "../api-futures";
import { Future } from "../../domain/entities/generic/Future";
import {
    PREVALENCE_FACILITY_LEVEL_FORM_ID,
    WARD_SUMMARY_STATISTICS_FORM_ID,
} from "../entities/D2Survey";
import _c from "../../domain/entities/generic/Collection";
import { DataValue } from "@eyeseetea/d2-api/api/trackerEvents";
import { Maybe } from "../../utils/ts-utils";

type WardEvent = {
    eventId: string;
    wardId: string;
    specialtyCode: string;
};

type D2Event = {
    event: Id;
    programStage: Id;
    dataValues: DataValue[];
};

type WardSummaryDataSet = {
    name: string;
    dataElements: Array<NamedRef & { categoryOptionCombos: NamedRef[] }>;
};

export class WardFormD2Repository implements WardFormRepository {
    constructor(private api: D2Api) {}

    get(facilityId: Id, period: string): FutureData<WardForm[]> {
        // +4h
        // get ward data in PREVALENCE_FACILITY_LEVEL_FORM_ID tracker program for that facilty
        // get data values for the ward dataset with facility id ou, period, specialty code and ward id
        // 1. get attribute option combos using specialty codes and ward ids from above
        // 2. get data values for WARD_SUMMARY_STATISTICS_FORM_ID dataset for the facility, period and attribute option combos from above
        // 3. ward forms can have a classical table structure with sections, rows and columns

        return Future.joinObj({
            wardFormData: this.getWardFormData(facilityId),
            dataValuesResponse: this.getDataValues(facilityId, period),
        }).flatMap(({ wardFormData, dataValuesResponse }) => {
            console.log({ wardFormData, dataValuesResponse });

            return Future.success(wardFormData);
        });
    }

    private getDataValues(facilityId: Id, period: string) {
        return this.getWardAttrIds(facilityId).flatMap(cocIds =>
            apiToFuture(
                this.api.dataValues.getSet({
                    dataSet: [WARD_SUMMARY_STATISTICS_FORM_ID],
                    orgUnit: [facilityId],
                    period: [period],
                    attributeOptionCombo: cocIds,
                })
            )
        );
    }

    private getWardFormData(facilityId: Id) {
        return Future.joinObj({
            wardEvents: this.getWardEvents(facilityId),
            dataSet: this.getWardSummaryDataSet(),
        }).map(({ wardEvents, dataSet }) => {
            return _c(wardEvents)
                .map(we => {
                    const title = `${we.wardId} - ${we.specialtyCode}`;
                    const columns = dataSet.dataElements[0]?.categoryOptionCombos ?? [];
                    const rows = dataSet.dataElements.map(dataElement => ({
                        id: dataElement.id,
                        name: dataElement.name,
                        items: columns.map(column => ({
                            column: column,
                            dataElement: dataElement.id,
                        })),
                    }));

                    return {
                        title: title,
                        columns: columns,
                        rows: rows,
                    };
                })
                .sortBy(wardEvent => wardEvent.title)
                .value();
        });
    }

    private getWardSummaryDataSet(): FutureData<WardSummaryDataSet> {
        return apiToFuture(
            this.api.metadata.get({
                dataSets: {
                    filter: { id: { eq: WARD_SUMMARY_STATISTICS_FORM_ID } },
                    fields: dataSetFields,
                },
            })
        ).flatMap(dataSetResponse => {
            const dataSet = dataSetResponse.dataSets[0];
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

    private getWardAttrIds(faciltyId: Id): FutureData<Id[]> {
        return Future.join2(this.getWardEvents(faciltyId), this.getD2Cocs()).flatMap(
            ([wardEvents, categoryOptionCombos]) => {
                const uniqueCocIds = _c(wardEvents)
                    .compactMap(wardEvent => {
                        const wardEventCoc = categoryOptionCombos.find(coc => {
                            const cocNames = coc.categoryOptions.map(co => co.name);

                            return (
                                cocNames.includes(wardEvent.specialtyCode) &&
                                cocNames.includes(wardEvent.wardId)
                            );
                        });
                        if (!wardEventCoc) return undefined;

                        return wardEventCoc.id;
                    })
                    .uniq()
                    .value();

                return Future.success(uniqueCocIds);
            }
        );
    }

    private getWardEvents(facilityId: Id): FutureData<WardEvent[]> {
        return this.getD2Events(facilityId).flatMap(events => {
            const filteredWardEvents = _c(events)
                .compactMap(event => {
                    if (event.programStage !== WARD_DATA_PROGRAM_STAGE_ID) return undefined;

                    const uniqueWardId = getDataValueByElementId(
                        event.dataValues,
                        dataElementIds.WARD_ID
                    );
                    const specialtyCode = getDataValueByElementId(
                        event.dataValues,
                        dataElementIds.SPECIALTY_CODE
                    );
                    if (uniqueWardId && specialtyCode) {
                        return {
                            eventId: event.event,
                            wardId: uniqueWardId,
                            specialtyCode: specialtyCode,
                        };
                    }

                    return undefined;
                })
                .value();

            return Future.success(filteredWardEvents);
        });
    }

    private getD2Cocs(): FutureData<D2CategoryOption["categoryOptionCombos"]> {
        return apiToFuture(
            this.api.metadata.get({
                categoryCombos: {
                    filter: {
                        id: {
                            eq: AMR_WARD_ID_MED_SPE_CAT_COMBO_ID,
                        },
                    },
                    fields: categoryOptionFields,
                },
            })
        ).flatMap(categoryComboResponse => {
            const categoryCombo = categoryComboResponse.categoryCombos[0];
            if (!categoryCombo)
                return Future.error(new Error("AMR Ward Id MED SPE category combo not found"));

            return Future.success(categoryCombo.categoryOptionCombos);
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
        ).map(response =>
            response.instances.flatMap(trackedEntity =>
                trackedEntity.enrollments.flatMap(enrollment => enrollment.events)
            )
        );
    }
}

function getDataValueByElementId(dataValues: DataValue[], dataElementId: string): Maybe<string> {
    return dataValues.find(dataValue => dataValue.dataElement === dataElementId)?.value;
}

const dataElementIds = {
    WARD_ID: "yAA33dsnWmY",
    SPECIALTY_CODE: "iowb9y894y2",
};
const WARD_DATA_PROGRAM_STAGE_ID = "ikaExmORX0F";
const AMR_WARD_ID_MED_SPE_CAT_COMBO_ID = "xVP6NkmUPA9";

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

const categoryOptionFields = {
    categoryOptionCombos: {
        id: true,
        categoryOptions: {
            id: true,
            name: true,
        },
    },
} as const;

type D2CategoryOption = MetadataPick<{
    categoryOptions: { fields: typeof categoryOptionFields };
}>["categoryOptions"][number];
