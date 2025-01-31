import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Future } from "../../domain/entities/generic/Future";
import { Id } from "../../domain/entities/Ref";
import { apiToFuture, FutureData } from "../api-futures";
import _ from "../../domain/entities/generic/Collection";
import { Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { PaginatedSurveyRepository } from "../../domain/repositories/PaginatedSurveyRepository";
import { PaginatedReponse } from "../../domain/entities/TablePagination";
import { getParentDataElementForProgram, isTrackerProgram } from "../utils/surveyProgramHelper";
import {
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF,
    AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID,
    PPS_PATIENT_REGISTER_ID,
    PREVALENCE_CASE_REPORT_FORM_ID,
    SURVEY_PATIENT_CODE_TEA_ID,
    SURVEY_PATIENT_ID_TEA_ID,
    WARD_ID_TEA_ID,
} from "../entities/D2Survey";
import { mapEventToSurvey, mapTrackedEntityToSurvey } from "../utils/surveyListMappers";
import { getSurveyChildCount, SurveyChildCountType } from "../utils/surveyChildCountHelper";

export class PaginatedSurveyD2Repository implements PaginatedSurveyRepository {
    constructor(private api: D2Api) {}

    getSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id,
        parentId: Id | undefined,
        page: number,
        pageSize: number
    ): FutureData<PaginatedReponse<Survey[]>> {
        return isTrackerProgram(programId)
            ? this.getTrackerProgramSurveys(
                  surveyFormType,
                  programId,
                  orgUnitId,
                  parentId,
                  page,
                  pageSize
              )
            : this.getEventProgramSurveys(
                  surveyFormType,
                  programId,
                  orgUnitId,
                  parentId,
                  page,
                  pageSize
              );
    }

    getTrackerProgramSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id,
        parentId: Id | undefined,
        page: number,
        pageSize: number
    ): FutureData<PaginatedReponse<Survey[]>> {
        const ouMode = undefined;

        const filterParentDEId = getParentDataElementForProgram(programId);

        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: { attributes: true, enrollments: true, trackedEntity: true, orgUnit: true },
                program: programId,
                orgUnit: orgUnitId,
                ouMode: ouMode,
                page: page + 1,
                pageSize,
                totalPages: true,
                filter: `${filterParentDEId}:eq:${parentId}`,
            })
        ).flatMap(trackedEntities => {
            const surveys = mapTrackedEntityToSurvey(trackedEntities, surveyFormType);

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

    getEventProgramSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id,
        parentId: Id | undefined,
        page: number,
        pageSize: number
    ): FutureData<PaginatedReponse<Survey[]>> {
        const ouMode = undefined;
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
                fields: { attributes: true, enrollments: true, trackedEntity: true, orgUnit: true },
                program: PPS_PATIENT_REGISTER_ID,
                orgUnit: orgUnitId,
                pageSize: 10,
                totalPages: true,
                filter: ` ${SURVEY_PATIENT_ID_TEA_ID}:like:${keyword}, ${WARD_ID_TEA_ID}:eq:${parentId}`,
            })
        ).flatMap(trackedEntities => {
            const surveys = mapTrackedEntityToSurvey(trackedEntities, "PPSPatientRegister");

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
                fields: { attributes: true, enrollments: true, trackedEntity: true, orgUnit: true },
                program: PPS_PATIENT_REGISTER_ID,
                orgUnit: orgUnitId,
                pageSize: 10,
                totalPages: true,
                filter: ` ${SURVEY_PATIENT_CODE_TEA_ID}:like:${keyword}, ${WARD_ID_TEA_ID}:eq:${parentId}`,
            })
        ).flatMap(trackedEntities => {
            const surveys = mapTrackedEntityToSurvey(trackedEntities, "PPSPatientRegister");

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
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: { attributes: true, enrollments: true, trackedEntity: true, orgUnit: true },
                program: PREVALENCE_CASE_REPORT_FORM_ID,
                orgUnit: orgUnitId,
                pageSize: 10,
                totalPages: true,
                filter: ` ${AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID}:like:${keyword}, ${AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF}:eq:${parentId}`,
            })
        ).flatMap(trackedEntities => {
            const surveys = mapTrackedEntityToSurvey(trackedEntities, "PrevalenceCaseReportForm");

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
    ): SurveyChildCountType {
        return getSurveyChildCount(
            parentProgram,
            orgUnitId,
            parentSurveyId,
            secondaryparentId,
            this.api
        );
    }
}
