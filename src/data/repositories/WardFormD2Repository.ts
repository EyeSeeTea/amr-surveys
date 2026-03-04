import { D2Api } from "../../types/d2-api";
import { Column, FormValue, Row, WardForm } from "../../domain/entities/Questionnaire/WardForm";
import { Id, NamedRef } from "../../domain/entities/Ref";
import { WardFormRepository } from "../../domain/repositories/WardFormRepository";
import { apiToFuture, FutureData } from "../api-futures";
import { Future } from "../../domain/entities/generic/Future";
import { WARD_SUMMARY_STATISTICS_FORM_ID } from "../entities/D2Survey";
import _c from "../../domain/entities/generic/Collection";
import { Maybe } from "../../utils/ts-utils";
import { WardEventDetails } from "../../domain/entities/Questionnaire/WardEvent";

type WardSummaryDataSet = {
    name: string;
    dataElements: Array<NamedRef & { categoryOptionCombos: NamedRef[] }>;
    sectionDataElementOrder: Id[];
};

export class WardFormD2Repository implements WardFormRepository {
    constructor(private api: D2Api) {}

    get(facilityId: Id, period: string, wardEvents: WardEventDetails[]): FutureData<WardForm[]> {
        return this.getWardSummaryDataSet().flatMap(dataSet =>
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
        wardEvents: WardEventDetails[]
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
        wardEvents: WardEventDetails[],
        formValues: FormValue[],
        dataSet: WardSummaryDataSet
    ): WardForm[] {
        return _c(wardEvents)
            .compactMap(event => this.mapEventToWardForm(event, formValues, dataSet))
            .sortBy(form => form.title)
            .value();
    }

    private mapEventToWardForm(
        wardEvent: WardEventDetails,
        formValues: FormValue[],
        dataSet: WardSummaryDataSet
    ): Maybe<WardForm> {
        const title = `${wardEvent.wardId} - ${wardEvent.specialtyCode}`;
        const columns = this.getColumns(dataSet);
        const rows = this.getRows(wardEvent, formValues, dataSet, columns);

        return { formId: wardEvent.formId, title, columns, rows };
    }

    private getColumns(dataSet: WardSummaryDataSet): Column[] {
        const categoryOptionCombos = dataSet.dataElements[0]?.categoryOptionCombos ?? [];

        return categoryOptionCombos.map(coc => {
            const columnName = coc.name?.trim() ?? "";

            return {
                id: coc.id,
                name: columnName,
                displayName: coc.name.toLowerCase() === "default" ? "" : columnName,
            };
        });
    }

    private getRows(
        wardEvent: WardEventDetails,
        formValues: FormValue[],
        dataSet: WardSummaryDataSet,
        columns: NamedRef[]
    ): Row[] {
        const dataElements =
            dataSet.sectionDataElementOrder.length > 0
                ? dataSet.sectionDataElementOrder
                      .map(id => dataSet.dataElements.find(dataElement => dataElement.id === id))
                      .filter(
                          (dataElement): dataElement is NonNullable<typeof dataElement> =>
                              !!dataElement
                      )
                : dataSet.dataElements;

        return dataElements.map(dataElement =>
            this.getSingleRow(dataElement, columns, wardEvent, formValues)
        );
    }

    private getSingleRow(
        dataElement: NamedRef & { categoryOptionCombos: NamedRef[] },
        columns: NamedRef[],
        wardEvent: WardEventDetails,
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

            const sectionDataElementOrder = dataSet.sections?.flatMap(
                section => section.dataElements?.map(de => de.id) ?? []
            );

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
                sectionDataElementOrder: sectionDataElementOrder,
            });
        });
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

const dataSetFields = {
    name: true,
    sections: {
        dataElements: {
            id: true,
        },
    },
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
