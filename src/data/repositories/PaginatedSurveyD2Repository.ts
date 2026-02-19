import { D2Api } from "../../types/d2-api";
import { Future } from "../../domain/entities/generic/Future";
import { Id } from "../../domain/entities/Ref";
import { apiToFuture, FutureData } from "../api-futures";
import _ from "../../domain/entities/generic/Collection";
import { ChildCount, Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { PaginatedSurveyRepository } from "../../domain/repositories/PaginatedSurveyRepository";
import { PaginatedReponse } from "../../domain/entities/TablePagination";
import { getParentDataElementForProgram, isTrackerProgram } from "../utils/surveyProgramHelper";
import {
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF,
    AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID,
    keyToDataElementMap,
    PPS_PATIENT_REGISTER_ID,
    PREVALENCE_CASE_REPORT_FORM_ID,
    SURVEY_PATIENT_CODE_TEA_ID,
    SURVEY_PATIENT_ID_TEA_ID,
    WARD_ID_TEA_ID,
} from "../entities/D2Survey";
import {
    mapEventToSurvey,
    mapTrackedEntityToSurvey,
    trackedEntityFields,
} from "../utils/surveyListMappers";
import { getSurveyChildCount } from "../utils/surveyChildCountHelper";
import { DataStoreClient } from "../DataStoreClient";
import { AMRSurveyModule } from "../../domain/entities/AMRSurveyModule";
import { DataStoreKeys } from "../DataStoreKeys";
import { TrackedOrderBase } from "@eyeseetea/d2-api/api/trackerTrackedEntities";

export class PaginatedSurveyD2Repository implements PaginatedSurveyRepository {
    modules: AMRSurveyModule[] = [];

    constructor(private api: D2Api, private dataStoreClient: DataStoreClient) {
        this.dataStoreClient.listCollection<AMRSurveyModule>(DataStoreKeys.MODULES).run(
            onSuccess => {
                this.modules = onSuccess;
            },
            onError => {
                console.error("Error fetching modules from DataStore", onError);
            }
        );
    }

    getSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id,
        parentId: Id | undefined,
        page: number,
        pageSize: number,
        sortPatientBy?: "patientId" | "patientCode",
        sortDir?: "asc" | "desc"
    ): FutureData<PaginatedReponse<Survey[]>> {
        return isTrackerProgram(programId, this.modules)
            ? this.getTrackerProgramSurveys(
                  surveyFormType,
                  programId,
                  orgUnitId,
                  parentId,
                  page,
                  pageSize,
                  sortDir,
                  sortPatientBy
              )
            : this.getEventProgramSurveys(
                  surveyFormType,
                  programId,
                  orgUnitId,
                  parentId,
                  page,
                  pageSize,
                  sortDir,
                  sortPatientBy
              );
    }

    private buildOrderForTrackerEntitiesSort(
        surveyFormType: SURVEY_FORM_TYPES,
        sortDir?: "asc" | "desc",
        sortPatientBy?: "patientId" | "patientCode"
    ): TrackedOrderBase[] | undefined {
        if (!sortDir) return undefined;

        if (surveyFormType === "PrevalenceCaseReportForm") {
            return [
                {
                    type: "trackedEntityAttributeId",
                    id: AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID,
                    direction: sortDir,
                },
            ];
        }
        if (surveyFormType === "PPSPatientRegister") {
            const effective = sortPatientBy ?? "patientId";
            const id =
                effective === "patientCode" ? SURVEY_PATIENT_CODE_TEA_ID : SURVEY_PATIENT_ID_TEA_ID;
            return [{ type: "trackedEntityAttributeId", id, direction: sortDir }];
        }

        return undefined;
    }

    getTrackerProgramSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id,
        parentId: Id | undefined,
        page: number,
        pageSize: number,
        sortDir?: "asc" | "desc",
        sortPatientBy?: "patientId" | "patientCode"
    ): FutureData<PaginatedReponse<Survey[]>> {
        const ouMode = "SELECTED";

        const filterParentDEId = getParentDataElementForProgram(programId, this.modules);

        const order = this.buildOrderForTrackerEntitiesSort(surveyFormType, sortDir, sortPatientBy);

        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: trackedEntityFields,
                program: programId,
                orgUnit: orgUnitId,
                ouMode: ouMode,
                page: page + 1,
                pageSize,
                totalPages: true,
                filter: `${filterParentDEId}:eq:${parentId}`,
                ...(order ? { order: order } : {}),
            })
        ).flatMap(trackedEntities => {
            const instances = trackedEntities.instances;
            const surveys = mapTrackedEntityToSurvey(instances, surveyFormType);

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

    private getDataElementUidForEventSort(
        surveyFormType: SURVEY_FORM_TYPES,
        sortPatientBy?: "patientId" | "patientCode"
    ): string | undefined {
        const effectiveSortBy =
            surveyFormType === "PrevalenceCaseReportForm"
                ? "patientId"
                : sortPatientBy ?? "patientId";

        const entry = keyToDataElementMap.find(m => m.key === effectiveSortBy);
        return entry?.dataElements?.[0];
    }

    getEventProgramSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id,
        parentId: Id | undefined,
        page: number,
        pageSize: number,
        sortDir?: "asc" | "desc",
        sortPatientBy?: "patientId" | "patientCode"
    ): FutureData<PaginatedReponse<Survey[]>> {
        const ouMode = "SELECTED";
        const dataElementUid = this.getDataElementUidForEventSort(surveyFormType, sortPatientBy);
        const order = sortDir && dataElementUid ? `${dataElementUid}:${sortDir}` : undefined;

        return apiToFuture(
            this.api.tracker.events.get({
                fields: { $all: true },
                program: programId,
                orgUnit: orgUnitId,
                ouMode: ouMode,
                page: page + 1,
                pageSize,
                totalPages: true,
                filter: `${WARD_ID_TEA_ID}:eq:${parentId}`,
                ...(order ? { order: order } : {}),
            })
        ).flatMap(response => {
            const events = response.instances;

            const surveys = mapEventToSurvey(events, surveyFormType, programId);

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
    }

    getFilteredPPSPatientByPatientIdSurveys(
        keyword: string,
        orgUnitId: Id,
        parentId: Id
    ): FutureData<PaginatedReponse<Survey[]>> {
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: trackedEntityFields,
                program: PPS_PATIENT_REGISTER_ID,
                orgUnit: orgUnitId,
                ouMode: "SELECTED",
                pageSize: 10,
                totalPages: true,
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
        parentId: Id
    ): FutureData<PaginatedReponse<Survey[]>> {
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: trackedEntityFields,
                program: PPS_PATIENT_REGISTER_ID,
                orgUnit: orgUnitId,
                ouMode: "SELECTED",
                pageSize: 10,
                totalPages: true,
                filter: `${SURVEY_PATIENT_CODE_TEA_ID}:like:${keyword},${WARD_ID_TEA_ID}:eq:${parentId}`,
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
        parentId: Id
    ): FutureData<PaginatedReponse<Survey[]>> {
        const prevalenceCaseReportId = this.getPrevalenceCaseReportId(parentId);

        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: trackedEntityFields,
                program: prevalenceCaseReportId,
                orgUnit: orgUnitId,
                ouMode: "SELECTED",
                pageSize: 10,
                totalPages: true,
                filter: [
                    `${AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID}:like:${keyword}`,
                    `${AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF}:eq:${parentId}`,
                ].join(","),
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
            this.api,
            this.modules
        );
    }

    private getPrevalenceCaseReportId(surveyId: string): string {
        const prevalence = this.modules.find(module => module.name === "Prevalence");

        const customForm =
            prevalence?.customForms?.[surveyId]?.[PREVALENCE_CASE_REPORT_FORM_ID] ||
            PREVALENCE_CASE_REPORT_FORM_ID;

        return customForm;
    }
}
