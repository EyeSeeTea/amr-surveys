import { D2Api } from "@eyeseetea/d2-api/2.36";

import { Future } from "../../domain/entities/generic/Future";

import { Id } from "../../domain/entities/Ref";

import { apiToFuture, FutureData } from "../api-futures";
import _ from "../../domain/entities/generic/Collection";

import { Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { PaginatedSurveyRepository } from "../../domain/repositories/PaginatedSurveyRepository";
import { PaginatedReponse } from "../../domain/entities/TablePagination";
import { getParentDataElementForProgram, isTrackerProgram } from "../utils/surveyProgramHelper";
import { WARD_ID_DATAELEMENT_ID } from "../entities/D2Survey";

import { SurveyD2Repository } from "./SurveyFormD2Repository";

export class PaginatedSurveyD2Repository implements PaginatedSurveyRepository {
    constructor(private api: D2Api, private surveyFormRepository: SurveyD2Repository) {}

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

    //Currently tracker programs are only in Prevelance module
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
            const surveys = this.surveyFormRepository.mapTrackedEntityToSurvey(
                trackedEntities,
                surveyFormType
            );

            return Future.sequential(surveys).map(surveys => {
                return {
                    pager: {
                        page: trackedEntities.page,
                        pageSize: trackedEntities.pageSize,
                        total: trackedEntities.total,
                    },
                    objects: surveys,
                };
            });
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

            const surveys = this.surveyFormRepository.mapEventToSurvey(
                events,
                surveyFormType,
                programId
            );

            return Future.sequential(surveys).map(surveys => {
                return {
                    pager: {
                        page: response.page,
                        pageSize: response.pageSize,
                        total: response.total,
                    },
                    objects: surveys,
                };
            });
        });
    }
}
