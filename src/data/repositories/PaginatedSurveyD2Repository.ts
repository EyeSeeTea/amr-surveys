import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Future } from "../../domain/entities/generic/Future";
import { Id, NamedRef } from "../../domain/entities/Ref";
import { apiToFuture, FutureData } from "../api-futures";
import _ from "../../domain/entities/generic/Collection";
import { ChildCount, Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { PaginatedSurveyRepository } from "../../domain/repositories/PaginatedSurveyRepository";
import {
    PAGE_SIZE,
    PaginatedReponse,
    SortableColumnName,
    SortColumnDetails,
    SortOrder,
} from "../../domain/entities/TablePagination";
import { getParentDataElementForProgram, isTrackerProgram } from "../utils/surveyProgramHelper";
import {
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF,
    AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID,
    PPS_COUNTRY_QUESTIONNAIRE_ID,
    PPS_HOSPITAL_FORM_ID,
    PPS_PATIENT_REGISTER_ID,
    PPS_WARD_REGISTER_ID,
    PREVALENCE_CASE_REPORT_FORM_ID,
    PREVALENCE_FACILITY_LEVEL_FORM_ID,
    PREVALENCE_START_DATE_DATAELEMENT_ID,
    PREVALENCE_SURVEY_FORM_ID,
    PREVALENCE_SURVEY_NAME_DATAELEMENT_ID,
    START_DATE_DATAELEMENT_ID,
    SURVEY_HOSPITAL_CODE_DATAELEMENT_ID,
    SURVEY_NAME_DATAELEMENT_ID,
    SURVEY_PATIENT_CODE_TEA_ID,
    SURVEY_PATIENT_ID_TEA_ID,
    SURVEY_TYPE_DATAELEMENT_ID,
    SURVEY_WARD_CODE_DATAELEMENT_ID,
    WARD_ID_TEA_ID,
} from "../entities/D2Survey";
import {
    D2TrackerEntitySelectedPick,
    mapEventToSurvey,
    mapTrackedEntityToSurvey,
    trackedEntityFields,
} from "../utils/surveyListMappers";
import { getSurveyChildCount } from "../utils/surveyChildCountHelper";
import { Maybe } from "../../utils/ts-utils";
import {
    TrackedEntitiesGetResponse,
    TrackedOrderBase,
} from "@eyeseetea/d2-api/api/trackerTrackedEntities";

type Filter = {
    id: string;
    value: string;
};

const OU_CHUNK_SIZE = 500;

export class PaginatedSurveyD2Repository implements PaginatedSurveyRepository {
    constructor(private api: D2Api) {}

    getSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id,
        parentId: Id | undefined,
        page: number,
        pageSize: number,
        chunked = false,
        sortColumnDetails?: SortColumnDetails
    ): FutureData<PaginatedReponse<Survey[]>> {
        const filter = this.getFilterByParentId(programId, parentId);
        const sortOrder = sortColumnDetails
            ? this.mapColumnToIdForSort(sortColumnDetails, surveyFormType)
            : undefined;

        return isTrackerProgram(programId)
            ? this.getTrackerProgramSurveys(
                  surveyFormType,
                  programId,
                  orgUnitId,
                  chunked,
                  filter,
                  page,
                  pageSize,
                  sortOrder
              )
            : this.getEventProgramSurveys(
                  surveyFormType,
                  programId,
                  orgUnitId,
                  filter,
                  page,
                  pageSize,
                  sortOrder
              );
    }

    private getTrackerProgramSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id,
        chunked = false,
        filter: Maybe<Filter>,
        page: number,
        pageSize: number,
        sortOrder?: SortOrder
    ): FutureData<PaginatedReponse<Survey[]>> {
        return chunked
            ? this.getTrackerProgramSurveysChunked(
                  surveyFormType,
                  programId,
                  orgUnitId,
                  filter,
                  page,
                  pageSize,
                  sortOrder
              )
            : this.getTrackerProgramSurveysUnchunked(
                  surveyFormType,
                  programId,
                  orgUnitId,
                  filter,
                  page,
                  pageSize,
                  sortOrder
              );
    }

    private getTrackerProgramSurveysUnchunked(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id,
        filter: Maybe<Filter>,
        page: number,
        pageSize: number,
        sortOrder?: SortOrder
    ): FutureData<PaginatedReponse<Survey[]>> {
        const ouMode =
            (orgUnitId !== "" && programId === PREVALENCE_FACILITY_LEVEL_FORM_ID) ||
            programId === PPS_PATIENT_REGISTER_ID
                ? "DESCENDANTS"
                : "SELECTED";

        return this.getTrackerEnityMappedSurveysPaginated(
            programId,
            orgUnitId,
            page,
            pageSize,
            filter,
            ouMode,
            surveyFormType,
            sortOrder
        );
    }

    private getTrackerProgramSurveysChunked(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnits: string,
        filter: Maybe<Filter>,
        page: number,
        pageSize: number,
        sortOrder?: SortOrder
    ): FutureData<PaginatedReponse<Survey[]>> {
        const orgUnitIds = orgUnits.split(";");
        const chunkedOUs = _(orgUnitIds).chunk(OU_CHUNK_SIZE).value();

        const allChunkedSurveys = chunkedOUs.flatMap(ouChunk => {
            return this.getTrackerEnityMappedSurveysPaginated(
                programId,
                ouChunk.join(";"),
                page,
                pageSize,
                filter,
                "SELECTED",
                surveyFormType,
                sortOrder
            );
        });

        return Future.sequential(allChunkedSurveys).flatMap(listOfSurveys => {
            return Future.success(_(listOfSurveys).flatten());
        });
    }

    private getEventProgramSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id,
        filter: Maybe<Filter>,
        page: number,
        pageSize: number,
        sortOrder?: SortOrder
    ): FutureData<PaginatedReponse<Survey[]>> {
        const ouMode =
            orgUnitId !== "" &&
            (programId === PPS_WARD_REGISTER_ID ||
                programId === PPS_HOSPITAL_FORM_ID ||
                programId === PPS_COUNTRY_QUESTIONNAIRE_ID ||
                programId === PREVALENCE_SURVEY_FORM_ID)
                ? "DESCENDANTS"
                : "SELECTED";

        return apiToFuture(
            this.api.tracker.events.get({
                fields: { $all: true },
                program: programId,
                orgUnit: orgUnitId,
                ouMode: ouMode,
                page: page + 1,
                pageSize,
                totalPages: true,
                order: sortOrder ? `${sortOrder.id}:${sortOrder.direction}` : undefined,
                filter: filter ? `${filter.id}:eq:${filter.value}` : undefined,
            })
        ).flatMap(response => {
            const events = response.instances;

            return this.getOrgUnitNames(events.map(event => event.orgUnit)).flatMap(orgUnits => {
                const surveys = mapEventToSurvey(events, surveyFormType, programId, orgUnits);
                const paginatedSurveys: PaginatedReponse<Survey[]> = {
                    pager: {
                        page: response.page,
                        pageSize: response.pageSize,
                        total: response.total,
                    },
                    objects: surveys,
                };

                return Future.success(paginatedSurveys);
            });
        });
    }

    getFilteredPPSPatientByPatientIdSurveys(
        keyword: string,
        orgUnitId: Id,
        parentId: Id,
        sortOrder?: SortOrder
    ): FutureData<PaginatedReponse<Survey[]>> {
        const trackerOrder: Maybe<TrackedOrderBase[]> = sortOrder
            ? [
                  {
                      direction: sortOrder.direction,
                      type: "trackedEntityAttributeId",
                      id: sortOrder.id,
                  },
              ]
            : undefined;

        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: trackedEntityFields,
                program: PPS_PATIENT_REGISTER_ID,
                orgUnit: orgUnitId,
                ouMode: "SELECTED",
                pageSize: PAGE_SIZE,
                totalPages: true,
                order: trackerOrder,
                filter: `${SURVEY_PATIENT_ID_TEA_ID}:like:${keyword},${WARD_ID_TEA_ID}:eq:${parentId}`,
            })
        ).flatMap(trackedEntities => {
            const instances = trackedEntities.instances;
            const surveys = mapTrackedEntityToSurvey(instances, "PPSPatientRegister");

            const paginatedSurveys: PaginatedReponse<Survey[]> = {
                pager: {
                    page: trackedEntities.page,
                    pageSize: trackedEntities.pageSize,
                    total: trackedEntities.total,
                },
                objects: surveys,
            };

            return Future.success(paginatedSurveys);
        });
    }

    getFilteredPPSPatientByPatientCodeSurveys(
        keyword: string,
        orgUnitId: Id,
        parentId: Id,
        sortOrder?: SortOrder
    ): FutureData<PaginatedReponse<Survey[]>> {
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: trackedEntityFields,
                program: PPS_PATIENT_REGISTER_ID,
                orgUnit: orgUnitId,
                ouMode: "SELECTED",
                pageSize: PAGE_SIZE,
                totalPages: true,
                filter: `${SURVEY_PATIENT_CODE_TEA_ID}:like:${keyword},${WARD_ID_TEA_ID}:eq:${parentId}`,
                order: sortOrder
                    ? [
                          {
                              direction: sortOrder.direction,
                              type: "trackedEntityAttributeId",
                              id: sortOrder.id,
                          },
                      ]
                    : undefined,
            })
        ).flatMap(trackedEntities => {
            const instances = trackedEntities.instances;
            const surveys = mapTrackedEntityToSurvey(instances, "PPSPatientRegister");

            const paginatedSurveys: PaginatedReponse<Survey[]> = {
                pager: {
                    page: trackedEntities.page,
                    pageSize: trackedEntities.pageSize,
                    total: trackedEntities.total,
                },
                objects: surveys,
            };

            return Future.success(paginatedSurveys);
        });
    }

    getFilteredPrevalencePatientSurveysByPatientId(
        keyword: string,
        orgUnitId: Id,
        parentId: Id,
        sortOrder?: SortOrder
    ): FutureData<PaginatedReponse<Survey[]>> {
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: trackedEntityFields,
                program: PREVALENCE_CASE_REPORT_FORM_ID,
                orgUnit: orgUnitId,
                ouMode: "SELECTED",
                pageSize: PAGE_SIZE,
                totalPages: true,
                filter: `${AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID}:like:${keyword},${AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF}:eq:${parentId}`,
                order: sortOrder
                    ? [
                          {
                              direction: sortOrder.direction,
                              type: "trackedEntityAttributeId",
                              id: sortOrder.id,
                          },
                      ]
                    : undefined,
            })
        ).flatMap(trackedEntities => {
            const instances = trackedEntities.instances;
            const surveys = mapTrackedEntityToSurvey(instances, "PrevalenceCaseReportForm");

            const paginatedSurveys: PaginatedReponse<Survey[]> = {
                pager: {
                    page: trackedEntities.page,
                    pageSize: trackedEntities.pageSize,
                    total: trackedEntities.total,
                },
                objects: surveys,
            };

            return Future.success(paginatedSurveys);
        });
    }

    getPaginatedSurveyChildCount(
        parentProgram: Id,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId: Id | undefined
    ): FutureData<ChildCount> {
        return getSurveyChildCount(
            parentProgram,
            orgUnitId,
            parentSurveyId,
            secondaryparentId,
            this.api
        );
    }

    private getTrackerEnityMappedSurveysPaginated(
        programId: Id,
        orgUnits: string,
        page: number,
        pageSize: number,
        filter: Maybe<Filter>,
        ouMode: "SELECTED" | "DESCENDANTS",
        surveyFormType: SURVEY_FORM_TYPES,
        sortOrder?: SortOrder
    ): FutureData<PaginatedReponse<Survey[]>> {
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: trackedEntityFields,
                program: programId,
                orgUnit: orgUnits,
                ouMode: ouMode,
                page: page + 1,
                pageSize,
                totalPages: true,
                filter: filter ? `${filter.id}:eq:${filter.value}` : undefined,
                order: sortOrder
                    ? [
                          {
                              direction: sortOrder.direction,
                              type: "trackedEntityAttributeId",
                              id: sortOrder.id,
                          },
                      ]
                    : undefined,
            })
        ).flatMap((trackedEntities: TrackedEntitiesGetResponse<typeof trackedEntityFields>) => {
            const instances: D2TrackerEntitySelectedPick[] = trackedEntities.instances;
            return this.getOrgUnitNames(instances.map(instance => instance.orgUnit)).flatMap(
                orgUnits => {
                    const surveys = mapTrackedEntityToSurvey(instances, surveyFormType, orgUnits);
                    const paginatedSurveys: PaginatedReponse<Survey[]> = {
                        pager: {
                            page: trackedEntities.page,
                            pageSize: trackedEntities.pageSize,
                            total: trackedEntities.total,
                        },
                        objects: surveys,
                    };

                    return Future.success(paginatedSurveys);
                }
            );
        });
    }

    private getFilterByParentId(programId: string, parentId: Maybe<string>): Maybe<Filter> {
        const filterParentDEId = getParentDataElementForProgram(programId);

        const filter =
            parentId && filterParentDEId
                ? {
                      id: filterParentDEId,
                      value: parentId,
                  }
                : undefined;

        return filter;
    }

    private getOrgUnitNames(orgUnitIds: Id[]): FutureData<NamedRef[]> {
        return apiToFuture(
            this.api.models.organisationUnits.get({
                fields: { id: true, name: true },
                filter: { id: { in: orgUnitIds } },
                paging: false,
            })
        ).flatMap(orgUnitsResponse => {
            const orgUnits = orgUnitsResponse.objects.map(ou => {
                return { id: ou.id, name: ou.name };
            });
            return Future.success(orgUnits);
        });
    }

    private mapColumnToIdForSort(
        sortColumnDetails: SortColumnDetails,
        surveyFormType: SURVEY_FORM_TYPES
    ): SortOrder {
        return {
            direction: sortColumnDetails.direction,
            id: this.getIdForColumnName(sortColumnDetails.column, surveyFormType),
        };
    }

    private getIdForColumnName(column: SortableColumnName, surveyFormType: SURVEY_FORM_TYPES): Id {
        switch (column) {
            case "hospitalCode":
                return SURVEY_HOSPITAL_CODE_DATAELEMENT_ID;
            case "startDate":
                return surveyFormType === "PPSSurveyForm"
                    ? START_DATE_DATAELEMENT_ID
                    : PREVALENCE_START_DATE_DATAELEMENT_ID;

            case "surveyType":
                return SURVEY_TYPE_DATAELEMENT_ID;
            case "uniquePatientCode":
                return SURVEY_PATIENT_CODE_TEA_ID;
            case "uniquePatientId":
                return SURVEY_PATIENT_ID_TEA_ID;
            case "wardCode":
                return SURVEY_WARD_CODE_DATAELEMENT_ID;
            case "surveyName":
            default:
                return surveyFormType === "PPSSurveyForm"
                    ? SURVEY_NAME_DATAELEMENT_ID
                    : PREVALENCE_SURVEY_NAME_DATAELEMENT_ID;
        }
    }
}
