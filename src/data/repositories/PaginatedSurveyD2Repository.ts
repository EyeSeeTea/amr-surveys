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
    PPS_PATIENT_REGISTER_ID,
    SURVEY_PATIENT_CODE_DATAELEMENT_ID,
    SURVEY_PATIENT_ID_DATAELEMENT_ID,
    WARD_ID_DATAELEMENT_ID,
} from "../entities/D2Survey";
import { TrackerEventsResponse } from "@eyeseetea/d2-api/api/trackerEvents";
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

    //Currently tracker programs are only in Prevalence module
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
                filter: `${WARD_ID_DATAELEMENT_ID}:eq:${parentId}`,
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

    getFilteredPPSPatientSurveys(
        keyword: string,
        orgUnitId: Id
    ): FutureData<PaginatedReponse<Survey[]>> {
        return apiToFuture(
            this.api.get<TrackerEventsResponse>(
                `/tracker/events?filter=${SURVEY_PATIENT_ID_DATAELEMENT_ID}:like:${keyword}&filter=${SURVEY_PATIENT_CODE_DATAELEMENT_ID}:like:${keyword}&rootJunction=OR`,
                {
                    fields: ":all",
                    orgUnit: orgUnitId,
                    program: PPS_PATIENT_REGISTER_ID,
                }
            )
        ).flatMap(response => {
            const events = response.instances;

            const surveys = mapEventToSurvey(events, "PPSPatientRegister", PPS_PATIENT_REGISTER_ID);

            const paginatedSurveys: PaginatedReponse<Survey[]> = {
                pager: {
                    page: response.page,
                    pageSize: response.pageSize,
                    total: surveys.length,
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
