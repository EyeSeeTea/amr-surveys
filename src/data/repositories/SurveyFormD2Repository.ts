import { D2Api } from "@eyeseetea/d2-api/2.36";
import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { Future } from "../../domain/entities/generic/Future";
import { Id } from "../../domain/entities/Ref";
import { SurveyRepository } from "../../domain/repositories/SurveyRepository";
import { apiToFuture, FutureData } from "../api-futures";
import _ from "../../domain/entities/generic/Collection";
import { ImportStrategy, ProgramCountMap } from "../../domain/entities/Program";
import { Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import {
    D2TrackerTrackedEntity,
    D2TrackerTrackedEntity as TrackedEntity,
    TrackedEntitiesGetResponse,
} from "@eyeseetea/d2-api/api/trackerTrackedEntities";
import {
    getSurveyType,
    getTrackedEntityAttributeType,
    isTrackerProgram,
} from "../utils/surveyProgramHelper";
import {
    PREVALENCE_FACILITY_LEVEL_FORM_ID,
    PPS_WARD_REGISTER_ID,
    PPS_HOSPITAL_FORM_ID,
    PPS_PATIENT_REGISTER_ID,
    SURVEY_NAME_DATAELEMENT_ID,
    PREVALENCE_SURVEY_NAME_DATAELEMENT_ID,
} from "../entities/D2Survey";
import { ProgramDataElement, ProgramMetadata } from "../entities/D2Program";
import {
    mapProgramToQuestionnaire,
    mapQuestionnaireToEvent,
    mapQuestionnaireToTrackedEntities,
} from "../utils/surveyFormMappers";
import { mapEventToSurvey, mapTrackedEntityToSurvey } from "../utils/surveyListMappers";
import { Questionnaire } from "../../domain/entities/Questionnaire/Questionnaire";
import { getSurveyChildCount } from "../utils/surveyCountHelper";

export class SurveyD2Repository implements SurveyRepository {
    constructor(private api: D2Api) {}

    getForm(
        programId: Id,
        eventId: Id | undefined,
        orgUnitId: Id | undefined
    ): FutureData<Questionnaire> {
        return apiToFuture(
            this.api.request<ProgramMetadata>({
                method: "get",
                url: `/programs/${programId}/metadata.json?fields=programs,dataElements,programStageDataElements,programStageSections,trackedEntityAttributes,programStages,programRules,programRuleVariables,programRuleActions`,
            })
        ).flatMap(resp => {
            if (resp.programs[0]) {
                const programDataElements = resp.programStageDataElements.map(
                    psde => psde.dataElement
                );

                const dataElementsWithSortOrder: ProgramDataElement[] = resp.dataElements.map(
                    de => {
                        return {
                            ...de,
                            sortOrder: resp.programStageDataElements.find(
                                psde => psde.dataElement.id === de.id
                            )?.sortOrder,
                        };
                    }
                );

                //If event specified,populate the form
                if (eventId) {
                    if (isTrackerProgram(programId)) {
                        if (!orgUnitId) return Future.error(new Error("Survey not found"));
                        return this.getTrackerProgramById(eventId, programId, orgUnitId).flatMap(
                            trackedEntity => {
                                if (resp.programs[0] && trackedEntity) {
                                    return Future.success(
                                        mapProgramToQuestionnaire(
                                            resp.programs[0],
                                            undefined,
                                            trackedEntity,
                                            programDataElements,
                                            dataElementsWithSortOrder,
                                            resp.options,
                                            resp.programStages,
                                            resp.programStageSections,
                                            resp.trackedEntityAttributes,
                                            resp.programRules,
                                            resp.programRuleVariables,
                                            resp.programRuleActions
                                        )
                                    );
                                } else {
                                    return Future.error(new Error("Survey not found"));
                                }
                            }
                        );
                    }
                    //Get event from eventId
                    else {
                        return this.getEventProgramById(eventId).flatMap(event => {
                            if (resp.programs[0] && event) {
                                return Future.success(
                                    mapProgramToQuestionnaire(
                                        resp.programs[0],
                                        event,
                                        undefined,
                                        programDataElements,
                                        dataElementsWithSortOrder,
                                        resp.options,
                                        resp.programStages,
                                        resp.programStageSections,
                                        resp.trackedEntityAttributes,
                                        resp.programRules,
                                        resp.programRuleVariables,
                                        resp.programRuleActions
                                    )
                                );
                            } else {
                                return Future.error(new Error("Event Program not found"));
                            }
                        });
                    }
                }
                //return empty form
                else {
                    return Future.success(
                        mapProgramToQuestionnaire(
                            resp.programs[0],
                            undefined,
                            undefined,
                            programDataElements,
                            dataElementsWithSortOrder,
                            resp.options,
                            resp.programStages,
                            resp.programStageSections,
                            resp.trackedEntityAttributes,
                            resp.programRules,
                            resp.programRuleVariables,
                            resp.programRuleActions
                        )
                    );
                }
            } else {
                return Future.error(new Error("Event Program not found"));
            }
        });
    }

    saveFormData(
        questionnaire: Questionnaire,
        action: ImportStrategy,
        orgUnitId: Id,
        eventId: string | undefined,
        programId: Id
    ): FutureData<Id | undefined> {
        const $payload = isTrackerProgram(programId)
            ? mapQuestionnaireToTrackedEntities(questionnaire, orgUnitId, programId, eventId)
            : mapQuestionnaireToEvent(questionnaire, orgUnitId, programId, this.api, eventId);

        return $payload.flatMap(payload => {
            return apiToFuture(
                this.api.tracker.postAsync({ importStrategy: action }, payload)
            ).flatMap(response => {
                return apiToFuture(
                    // eslint-disable-next-line testing-library/await-async-utils
                    this.api.system.waitFor("TRACKER_IMPORT_JOB", response.response.id)
                ).flatMap(result => {
                    if (result && result.status !== "ERROR") {
                        //return the saved survey id.

                        const surveyId = isTrackerProgram(programId)
                            ? result.bundleReport?.typeReportMap?.TRACKED_ENTITY?.objectReports[0]
                                  ?.uid
                            : result.bundleReport?.typeReportMap?.EVENT?.objectReports[0]?.uid;
                        return Future.success(surveyId);
                    } else {
                        return Future.error(
                            new Error(
                                `Error: ${result?.validationReport?.errorReports?.at(0)?.message} `
                            )
                        );
                    }
                });
            });
        });
    }

    getSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id
    ): FutureData<Survey[]> {
        return isTrackerProgram(programId)
            ? this.getTrackerProgramSurveys(surveyFormType, programId, orgUnitId)
            : this.getEventProgramSurveys(surveyFormType, programId, orgUnitId);
    }

    //Currently tracker programs are only in Prevalence module
    private getTrackerProgramSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id
    ): FutureData<Survey[]> {
        const ouMode =
            orgUnitId !== "" && programId === PREVALENCE_FACILITY_LEVEL_FORM_ID
                ? "DESCENDANTS"
                : undefined;

        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: { attributes: true, enrollments: true, trackedEntity: true, orgUnit: true },
                program: programId,
                orgUnit: orgUnitId,
                ouMode: ouMode,
            })
        ).flatMap((trackedEntities: TrackedEntitiesGetResponse) => {
            const surveys = mapTrackedEntityToSurvey(trackedEntities, surveyFormType);
            return Future.success(surveys);
        });
    }

    private getEventProgramSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id
    ): FutureData<Survey[]> {
        const ouMode =
            orgUnitId !== "" &&
            (programId === PPS_WARD_REGISTER_ID ||
                programId === PPS_HOSPITAL_FORM_ID ||
                programId === PPS_PATIENT_REGISTER_ID)
                ? "DESCENDANTS"
                : undefined;
        return apiToFuture(
            this.api.tracker.events.get({
                fields: { $all: true },
                program: programId,
                orgUnit: orgUnitId,
                ouMode: ouMode,
            })
        ).flatMap(response => {
            const events = response.instances;
            const surveys = mapEventToSurvey(events, surveyFormType, programId);
            return Future.success(surveys);
        });
    }

    getPopulatedSurveyById(
        eventId: Id,
        programId: Id,
        orgUnitId: Id | undefined
    ): FutureData<Questionnaire> {
        if (isTrackerProgram(programId) && !orgUnitId)
            return Future.error(new Error("Unable to find survey"));
        return this.getForm(programId, eventId, orgUnitId);
    }

    private getEventProgramById(eventId: Id): FutureData<D2TrackerEvent | void> {
        return apiToFuture(
            this.api.tracker.events.getById(eventId, {
                fields: { $all: true },
            })
        ).flatMap(resp => {
            if (resp) return Future.success(resp);
            else return Future.success(undefined);
        });
    }

    private getTrackerProgramById(
        trackedEntityId: Id,
        programId: Id,
        orgUnitId: Id
    ): FutureData<TrackedEntity | void> {
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: { attributes: true, enrollments: true, trackedEntity: true, orgUnit: true },
                orgUnit: orgUnitId,
                program: programId,
                trackedEntity: trackedEntityId,
                ouMode: "DESCENDANTS",
            })
        ).flatMap(resp => {
            if (resp) return Future.success(resp.instances[0]);
            else return Future.success(undefined);
        });
    }

    getSurveyNameFromId(id: Id, surveyFormType: SURVEY_FORM_TYPES): FutureData<string> {
        const parentSurveyType = getSurveyType(surveyFormType);

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
                            dv => dv.dataElement === PREVALENCE_SURVEY_NAME_DATAELEMENT_ID
                        )?.value;
                        return Future.success(prevalenceSurveyName ?? "");
                    }
                } else return Future.success("");
            })
            .flatMapError(_err => Future.success(""));
    }

    getSurveyChildCount(
        parentProgram: Id,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId: Id | undefined
    ):
        | { type: "value"; value: FutureData<number> }
        | { type: "map"; value: FutureData<ProgramCountMap> } {
        return getSurveyChildCount(
            parentProgram,
            orgUnitId,
            parentSurveyId,
            secondaryparentId,
            this.api
        );
    }

    deleteSurvey(id: Id, orgUnitId: Id, programId: Id): FutureData<void> {
        if (isTrackerProgram(programId)) {
            return this.deleteTrackerProgramSurvey(id, orgUnitId, programId);
        } else return this.deleteEventSurvey(id, orgUnitId, programId);
    }

    deleteEventSurvey(eventId: Id, orgUnitId: Id, programId: Id): FutureData<void> {
        const event: D2TrackerEvent = {
            event: eventId,
            orgUnit: orgUnitId,
            program: programId,
            // status doesn't play a part in deleting but is required
            status: "ACTIVE",
            occurredAt: "",
            dataValues: [],
        };
        return apiToFuture(
            this.api.tracker.postAsync({ importStrategy: "DELETE" }, { events: [event] })
        ).flatMap(response => {
            return apiToFuture(
                // eslint-disable-next-line testing-library/await-async-utils
                this.api.system.waitFor("TRACKER_IMPORT_JOB", response.response.id)
            ).flatMap(result => {
                if (result && result.status !== "ERROR") {
                    return Future.success(undefined);
                } else {
                    return Future.error(
                        new Error(
                            `Error: ${result?.validationReport?.errorReports?.at(0)?.message} `
                        )
                    );
                }
            });
        });
    }

    deleteTrackerProgramSurvey(teiId: Id, orgUnitId: Id, programId: Id): FutureData<void> {
        const trackedEntity: D2TrackerTrackedEntity = {
            orgUnit: orgUnitId,
            trackedEntity: teiId,
            trackedEntityType: getTrackedEntityAttributeType(programId),
        };

        return apiToFuture(
            this.api.tracker.postAsync(
                { importStrategy: "DELETE" },
                { trackedEntities: [trackedEntity] }
            )
        ).flatMap(response => {
            return apiToFuture(
                // eslint-disable-next-line testing-library/await-async-utils
                this.api.system.waitFor("TRACKER_IMPORT_JOB", response.response.id)
            ).flatMap(result => {
                if (result && result.status !== "ERROR") {
                    return Future.success(undefined);
                } else {
                    return Future.error(
                        new Error(
                            `Error: ${result?.validationReport?.errorReports?.at(0)?.message} `
                        )
                    );
                }
            });
        });
    }
}
