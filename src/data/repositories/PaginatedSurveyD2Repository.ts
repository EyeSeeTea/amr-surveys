import { D2Api } from "@eyeseetea/d2-api/2.36";

import { Future } from "../../domain/entities/generic/Future";

import { Id } from "../../domain/entities/Ref";

import { apiToFuture, FutureData } from "../api-futures";
import _ from "../../domain/entities/generic/Collection";

import { Survey, SURVEY_FORM_TYPES, SURVEY_STATUSES } from "../../domain/entities/Survey";
import { PaginatedSurveyRepository } from "../../domain/repositories/PaginatedSurveyRepository";
import { PaginatedReponse } from "../../domain/entities/TablePagination";
import {
    getParentDataElementForProgram,
    getSurveyNameBySurveyFormType,
    isTrackerProgram,
} from "../utils/programHelper";
import {
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF,
    PREVELANCE_SURVEY_NAME_DATAELEMENT_ID,
    SURVEY_ID_DATAELEMENT_ID,
    SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID,
    SURVEY_ID_PATIENT_DATAELEMENT_ID,
    SURVEY_NAME_DATAELEMENT_ID,
    SURVEY_PATIENT_CODE_DATAELEMENT_ID,
    WARD_ID_DATAELEMENT_ID,
} from "./SurveyFormD2Repository";
import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";

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
            const surveys = trackedEntities.instances.map(trackedEntity => {
                const parentPrevalenceSurveyId =
                    trackedEntity.attributes?.find(
                        attribute =>
                            attribute.attribute === SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID ||
                            attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF ||
                            attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL ||
                            attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS ||
                            attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL ||
                            attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF
                    )?.value ?? "";

                return this.getSurveyNameFromId(parentPrevalenceSurveyId, "Prevalence").map(
                    parentppsSurveyName => {
                        const survey: Survey = {
                            id: trackedEntity.trackedEntity ?? "",
                            name: trackedEntity.trackedEntity ?? "",
                            rootSurvey: {
                                id: parentPrevalenceSurveyId ?? "",
                                name: parentppsSurveyName,
                                surveyType: "",
                            },
                            startDate: trackedEntity.createdAt
                                ? new Date(trackedEntity.createdAt)
                                : undefined,
                            status: "ACTIVE",
                            assignedOrgUnit: {
                                id: trackedEntity.orgUnit ?? "",
                                name: "",
                            },
                            surveyType: "",
                            parentWardRegisterId: undefined,
                            surveyFormType: surveyFormType,
                        };
                        return survey;
                    }
                );
            });

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

            const surveys = events.map(event => {
                let startDateString,
                    parentPPSSurveyId = "",
                    parentWardRegisterId = "",
                    patientCode = "";

                event.dataValues.forEach(dv => {
                    if (
                        dv.dataElement === SURVEY_ID_DATAELEMENT_ID ||
                        dv.dataElement === SURVEY_ID_PATIENT_DATAELEMENT_ID
                    )
                        parentPPSSurveyId = dv.value;

                    if (dv.dataElement === WARD_ID_DATAELEMENT_ID) parentWardRegisterId = dv.value;

                    if (dv.dataElement === SURVEY_PATIENT_CODE_DATAELEMENT_ID)
                        patientCode = dv.value;
                });

                const startDate = startDateString ? new Date(startDateString) : undefined;

                return this.getSurveyNameFromId(parentPPSSurveyId, "PPS").map(
                    parentppsSurveyName => {
                        const survey: Survey = {
                            id: event.event,
                            name: getSurveyNameBySurveyFormType(surveyFormType, {
                                eventId: event.event,
                                surveyName: "",
                                orgUnitName: event.orgUnitName,
                                hospitalCode: "",
                                wardCode: "",
                                patientCode,
                            }),
                            rootSurvey: {
                                id: parentPPSSurveyId,
                                name: parentppsSurveyName,
                                surveyType: "",
                            },
                            startDate: startDate,
                            status:
                                event.status === "COMPLETED"
                                    ? ("COMPLETED" as SURVEY_STATUSES)
                                    : ("ACTIVE" as SURVEY_STATUSES),
                            assignedOrgUnit: { id: event.orgUnit, name: event.orgUnitName ?? "" },
                            surveyType: "",
                            parentWardRegisterId: parentWardRegisterId,
                            surveyFormType: surveyFormType,
                        };
                        return survey;
                    }
                );
            });

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

    getSurveyNameFromId(id: Id, parentSurveyType: "PPS" | "Prevalence"): FutureData<string> {
        if (id !== "")
            return this.getEventProgramById(id)
                .flatMap(survey => {
                    if (survey) {
                        if (parentSurveyType === "PPS") {
                            const ppsSurveyName = survey.dataValues?.find(
                                dv => dv.dataElement === SURVEY_NAME_DATAELEMENT_ID
                            )?.value;
                            return Future.success(ppsSurveyName ?? "");
                        } else {
                            const prevalenceSurveyName = survey.dataValues?.find(
                                dv => dv.dataElement === PREVELANCE_SURVEY_NAME_DATAELEMENT_ID
                            )?.value;
                            return Future.success(prevalenceSurveyName ?? "");
                        }
                    } else return Future.success("");
                })
                .flatMapError(_err => Future.success(""));
        else return Future.success("");
    }

    getEventProgramById(eventId: Id): FutureData<D2TrackerEvent | void> {
        return apiToFuture(
            this.api.tracker.events.getById(eventId, {
                fields: { $all: true },
            })
        ).flatMap(resp => {
            if (resp) return Future.success(resp);
            else return Future.success(undefined);
        });
    }
}
