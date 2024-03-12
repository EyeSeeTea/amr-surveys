import { D2Api } from "@eyeseetea/d2-api/2.36";
import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { Future } from "../../domain/entities/generic/Future";
import {
    Questionnaire,
    QuestionnaireEntity,
    QuestionnaireStage,
} from "../../domain/entities/Questionnaire/Questionnaire";
import { Id, Ref } from "../../domain/entities/Ref";
import { SurveyRepository } from "../../domain/repositories/SurveyRepository";
import { apiToFuture, FutureData } from "../api-futures";
import _ from "../../domain/entities/generic/Collection";
import { ImportStrategy, ProgramCountMap } from "../../domain/entities/Program";
import { Survey, SURVEY_FORM_TYPES, SURVEY_STATUSES } from "../../domain/entities/Survey";
import { DataValue } from "@eyeseetea/d2-api";
import {
    D2TrackerTrackedEntity,
    D2TrackerTrackedEntity as TrackedEntity,
    TrackedEntitiesGetResponse,
} from "@eyeseetea/d2-api/api/trackerTrackedEntities";
import {
    D2TrackerEnrollment,
    D2TrackerEnrollmentAttribute,
} from "@eyeseetea/d2-api/api/trackerEnrollments";
import {
    getChildProgramId,
    getParentDataElementForProgram,
    getSurveyNameBySurveyFormType,
    getSurveyType,
    getTrackedEntityAttributeType,
    isTrackerProgram,
} from "../utils/surveyProgramHelper";
import {
    SURVEY_ID_DATAELEMENT_ID,
    SURVEY_ID_PATIENT_DATAELEMENT_ID,
    WARD_ID_DATAELEMENT_ID,
    WARD2_ID_DATAELEMENT_ID,
    AMR_SURVEYS_PREVALENCE_DEA_SURVEY_ID,
    SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF,
    PREVALENCE_FACILITY_LEVEL_FORM_ID,
    PPS_WARD_REGISTER_ID,
    PPS_HOSPITAL_FORM_ID,
    PPS_PATIENT_REGISTER_ID,
    keyToDataElementMap,
    PPS_SURVEY_FORM_ID,
    PREVALENCE_SURVEY_FORM_ID,
    SURVEY_NAME_DATAELEMENT_ID,
    PREVALENCE_SURVEY_NAME_DATAELEMENT_ID,
    PPS_COUNTRY_QUESTIONNAIRE_ID,
} from "../entities/D2Survey";
import {
    D2ProgramRule,
    D2ProgramRuleAction,
    D2ProgramRuleVariable,
    Option,
    Program,
    ProgramDataElement,
    ProgramMetadata,
    ProgramStage,
    ProgramStageSection,
    TrackedEntityAttibute,
} from "../entities/D2Program";
import { QuestionnaireSection } from "../../domain/entities/Questionnaire/QuestionnaireSection";
import { QuestionnaireRule } from "../../domain/entities/Questionnaire/QuestionnaireRules";
import {
    BooleanQuestion,
    DateQuestion,
    DateTimeQuestion,
    NumberQuestion,
    Question,
    SelectQuestion,
    TextQuestion,
} from "../../domain/entities/Questionnaire/QuestionnaireQuestion";

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
                                        this.mapProgramToQuestionnaire(
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
                                    this.mapProgramToQuestionnaire(
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
                        this.mapProgramToQuestionnaire(
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

    private mapProgramToQuestionnaire(
        program: Program,
        event: D2TrackerEvent | undefined,
        trackedEntity: TrackedEntity | undefined,
        programDataElements: Ref[],
        dataElements: ProgramDataElement[],
        options: Option[],
        programStages?: ProgramStage[],
        programStageSections?: ProgramStageSection[],
        trackedEntityAttributes?: TrackedEntityAttibute[],
        programRules?: D2ProgramRule[],
        programRuleVariables?: D2ProgramRuleVariable[],
        programRuleActions?: D2ProgramRuleAction[]
    ): Questionnaire {
        //If the Program has sections, fetch and use programStageSections
        const sections: QuestionnaireSection[] = programStageSections
            ? programStageSections.map(section => {
                  const questions = this.mapProgramDataElementToQuestions(
                      isTrackerProgram(program.id),
                      section.dataElements,
                      dataElements,
                      options,
                      event,
                      trackedEntity
                  );

                  return {
                      title: section.name,
                      code: section.id,
                      questions: questions,
                      isVisible: true,
                      stageId: section.programStage.id,
                      sortOrder: section.sortOrder,
                  };
              })
            : //If the Program has no sections, create a single section
              [
                  {
                      title: "Survey Info",
                      code: "default",
                      questions: this.mapProgramDataElementToQuestions(
                          isTrackerProgram(program.id),
                          programDataElements,
                          dataElements,
                          options,
                          event,
                          trackedEntity
                      ),
                      isVisible: true,
                      stageId: "default",
                      sortOrder: 1,
                  },
              ];

        //If the Program has stages, fetch and use programStages
        const stages: QuestionnaireStage[] = programStages
            ? programStages.map(stage => {
                  const currentProgramStageSections =
                      programStages.length === 1 //If there is only 1 program stage, then all the sections belong to it.
                          ? sections
                          : sections.filter(section => section.stageId === stage.id);

                  return {
                      title: stage.name,
                      code: stage.id,
                      sections: _(currentProgramStageSections)
                          .sortBy(section => section.sortOrder)
                          .value(),
                      isVisible: true,
                      instanceId: trackedEntity?.enrollments
                          ?.at(0)
                          ?.events.find(e => e.programStage === stage.id)?.event,
                      sortOrder: stage.sortOrder,
                      repeatable: stage.repeatable,
                  };
              })
            : //If the Program has no stages, create a single stage
              [
                  {
                      title: "STAGE",
                      code: "STAGE",
                      sections: _(sections)
                          .sortBy(section => section.sortOrder)
                          .value(),
                      isVisible: true,
                      sortOrder: 1,
                      repeatable: false,
                  },
              ];

        const orgUnitId = isTrackerProgram(program.id)
            ? trackedEntity?.orgUnit ?? ""
            : event?.orgUnit ?? "";

        const questionnaireRules: QuestionnaireRule[] = this.getProgramRules(
            programRules,
            programRuleVariables,
            programRuleActions
        );

        const form: Questionnaire = {
            id: program.id,
            name: program.name,
            description: program.name,
            orgUnit: { id: orgUnitId },
            year: "",
            isCompleted: false,
            isMandatory: false,
            stages: _(stages)
                .sortBy(stage => stage.sortOrder)
                .value(),
            subLevelDetails: {
                enrollmentId: trackedEntity
                    ? trackedEntity.enrollments?.at(0)?.enrollment ?? ""
                    : "",
            },
            rules: questionnaireRules,
        };

        if (trackedEntityAttributes) {
            const profileQuestions: Question[] = this.mapTrackedAttributesToQuestions(
                trackedEntityAttributes,
                options,
                trackedEntity
            );

            const profileSection: QuestionnaireEntity = {
                title: "Profile",
                code: "PROFILE",
                questions: profileQuestions,
                isVisible: true,
                stageId: "PROFILE",
            };
            form.entity = profileSection;
        }
        return form;
    }

    private mapProgramDataElementToQuestions(
        isTrackerProgram: boolean,
        sectionDataElements: { id: string }[],
        dataElements: ProgramDataElement[],
        options: Option[],
        event: D2TrackerEvent | undefined = undefined,
        trackedEntity: TrackedEntity | undefined = undefined
    ): Question[] {
        const questions: Question[] = _(
            sectionDataElements.map(dataElement => {
                const curDataElement = dataElements.find(de => de.id === dataElement.id);

                if (curDataElement) {
                    let dataValue: string | undefined;
                    if (isTrackerProgram) {
                        const dataValues = trackedEntity?.enrollments?.flatMap(enrollment => {
                            return _(
                                enrollment.events.map(e => {
                                    return e.dataValues.find(
                                        dv => dv.dataElement === curDataElement.id
                                    );
                                })
                            )
                                .compact()
                                .value();
                        });

                        if (dataValues && dataValues.length > 1) {
                            console.debug(
                                "ERROR : There should never be more than one instance of a dataelement in an event"
                            );
                        }

                        dataValue = dataValues?.at(0)?.value;
                    } else {
                        dataValue = event
                            ? event.dataValues.find(dv => dv.dataElement === curDataElement.id)
                                  ?.value
                            : undefined;
                    }

                    const currentQuestion = this.getQuestion(
                        curDataElement.valueType,
                        curDataElement.id,
                        curDataElement.code,
                        curDataElement.formName,
                        curDataElement.sortOrder,
                        options,
                        curDataElement.optionSet,
                        dataValue ?? ""
                    );

                    ///Disable Id fields which are auto generated.
                    if (
                        currentQuestion &&
                        (currentQuestion.id === SURVEY_ID_DATAELEMENT_ID ||
                            currentQuestion.id === SURVEY_ID_PATIENT_DATAELEMENT_ID ||
                            currentQuestion.id === WARD_ID_DATAELEMENT_ID ||
                            currentQuestion.id === WARD2_ID_DATAELEMENT_ID ||
                            currentQuestion.id === AMR_SURVEYS_PREVALENCE_DEA_SURVEY_ID)
                    ) {
                        currentQuestion.disabled = true;
                    }

                    return currentQuestion;
                }
            })
        )
            .compact()
            .sortBy(q => q.sortOrder)
            .value();

        return questions;
    }

    private mapTrackedAttributesToQuestions(
        attributes: TrackedEntityAttibute[],
        options: Option[],
        trackedEntity: TrackedEntity | undefined
    ): Question[] {
        const questions: Question[] = _(
            attributes.map(attribute => {
                const attributeValue = trackedEntity?.attributes?.find(
                    attr => attr.attribute === attribute.id
                );

                const currentQuestion = this.getQuestion(
                    attribute.valueType,
                    attribute.id,
                    attribute.code,
                    attribute.formName,
                    attribute.sortOrder,
                    options,
                    attribute.optionSet,
                    attributeValue?.value
                );
                if (
                    currentQuestion &&
                    (currentQuestion.id === SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID ||
                        currentQuestion?.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF ||
                        currentQuestion.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL ||
                        currentQuestion.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS ||
                        currentQuestion.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL ||
                        currentQuestion.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF)
                ) {
                    currentQuestion.disabled = true;
                }
                return currentQuestion;
            })
        )
            .compact()
            .sortBy(q => q.sortOrder)
            .value();

        return questions;
    }

    private getQuestion(
        valueType: string,
        id: Id,
        code: string,
        formName: string,
        sortOrder: number | undefined,
        options: Option[],
        optionSet?: { id: string },
        dataValue?: string
    ): Question | undefined {
        switch (valueType) {
            case "BOOLEAN": {
                const boolQ: BooleanQuestion = {
                    id: id,
                    code: code, //code
                    text: formName, //formName
                    type: "boolean",
                    storeFalse: true,
                    value: dataValue ? (dataValue === "true" ? true : false) : true,
                    isVisible: true,
                    sortOrder: sortOrder,
                    errors: [],
                };
                return boolQ;
            }
            case "TRUE_ONLY": {
                const boolQ: BooleanQuestion = {
                    id: id,
                    code: code, //code
                    text: formName, //formName
                    type: "boolean",
                    storeFalse: false,
                    value: dataValue ? (dataValue === "true" ? true : undefined) : undefined,
                    isVisible: true,
                    sortOrder: sortOrder,
                    errors: [],
                };
                return boolQ;
            }

            case "NUMBER":
            case "INTEGER": {
                const intQ: NumberQuestion = {
                    id: id,
                    code: code, //code
                    text: formName, //formName
                    type: "number",
                    numberType: "INTEGER",
                    value: dataValue ? dataValue : "",
                    isVisible: true,
                    sortOrder: sortOrder,
                    errors: [],
                };
                return intQ;
            }

            case "PHONE_NUMBER":
            case "EMAIL":
            case "TEXT": {
                if (optionSet) {
                    const selectOptions = options.filter(op => op.optionSet.id === optionSet?.id);

                    const selectedOption = dataValue
                        ? selectOptions.find(o => o.code === dataValue)
                        : undefined;

                    const selectQ: SelectQuestion = {
                        id: id || "",
                        code: code || "",
                        text: formName || "",
                        type: "select",
                        options: selectOptions,
                        value: selectedOption ? selectedOption : { name: "", id: "", code: "" },
                        isVisible: true,
                        sortOrder: sortOrder,
                        errors: [],
                    };
                    return selectQ;
                } else {
                    const singleLineText: TextQuestion = {
                        id: id,
                        code: code,
                        text: formName,
                        type: "text",
                        value: dataValue ? (dataValue as string) : "",
                        multiline: false,
                        isVisible: true,
                        sortOrder: sortOrder,
                        errors: [],
                    };
                    return singleLineText;
                }
            }

            case "LONG_TEXT": {
                const singleLineTextQ: TextQuestion = {
                    id: id,
                    code: code,
                    text: formName,
                    type: "text",
                    value: dataValue ? (dataValue as string) : "",
                    multiline: true,
                    isVisible: true,
                    sortOrder: sortOrder,
                    errors: [],
                };
                return singleLineTextQ;
            }

            case "DATE": {
                const dateQ: DateQuestion = {
                    id: id,
                    code: code,
                    text: formName,
                    type: "date",
                    value: dataValue ? new Date(dataValue as string) : new Date(),
                    isVisible: true,
                    sortOrder: sortOrder,
                    errors: [],
                };
                return dateQ;
            }

            case "DATETIME": {
                const dateQ: DateTimeQuestion = {
                    id: id,
                    code: code,
                    text: formName,
                    type: "datetime",
                    value: dataValue
                        ? new Date(dataValue as string).toISOString()
                        : new Date().toISOString(),
                    isVisible: true,
                    sortOrder: sortOrder,
                    errors: [],
                };
                return dateQ;
            }
        }
    }

    saveFormData(
        questionnaire: Questionnaire,
        action: ImportStrategy,
        orgUnitId: Id,
        eventId: string | undefined,
        programId: Id
    ): FutureData<void> {
        const $payload = isTrackerProgram(programId)
            ? this.mapQuestionnaireToTrackedEntities(questionnaire, orgUnitId, programId, eventId)
            : this.mapQuestionnaireToEvent(questionnaire, orgUnitId, programId, eventId);

        return $payload.flatMap(payload => {
            return apiToFuture(
                this.api.tracker.postAsync({ importStrategy: action }, payload)
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
        });
    }

    private mapQuestionsToDataValues(questions: Question[]): DataValue[] {
        const dataValues = _(
            questions.map(question => {
                if (question) {
                    if (question.type === "select" && question.value) {
                        return {
                            dataElement: question.id,
                            value: question.value.code,
                        };
                    } else if (question.type === "date" && question.value) {
                        return {
                            dataElement: question.id,
                            value: question.value.toISOString().split("T")?.at(0) || "",
                        };
                    } else if (question.type === "boolean" && question.storeFalse === false) {
                        return {
                            dataElement: question.id,
                            value: question.value ? question.value : undefined,
                        };
                    } else {
                        return {
                            dataElement: question.id,
                            value: question.value,
                        };
                    }
                }
            })
        )
            .compact()
            .value();

        return dataValues as DataValue[];
    }

    private mapQuestionnaireToEvent(
        questionnaire: Questionnaire,
        orgUnitId: string,
        programId: Id,
        eventId: string | undefined = undefined
    ): FutureData<{ events: D2TrackerEvent[] }> {
        const questions = questionnaire.stages.flatMap(stages =>
            stages.sections.flatMap(section => section.questions)
        );

        const dataValues = this.mapQuestionsToDataValues(questions);

        if (eventId) {
            return this.getEventProgramById(eventId).flatMap(event => {
                if (event) {
                    const updatedEvent: D2TrackerEvent = {
                        ...event,

                        dataValues: dataValues as DataValue[],
                    };
                    return Future.success({ events: [updatedEvent] });
                } else {
                    return Future.error(new Error("Unable to find event to update"));
                }
            });
        } else {
            const event: D2TrackerEvent = {
                event: "",
                orgUnit: orgUnitId,
                program: programId,
                status: "ACTIVE",
                occurredAt: new Date().toISOString().split("T")?.at(0) || "",
                //@ts-ignore
                dataValues: dataValues,
            };
            return Future.success({ events: [event] });
        }
    }

    private mapQuestionnaireToTrackedEntities(
        questionnaire: Questionnaire,
        orgUnitId: string,
        programId: Id,
        teiId: string | undefined = undefined
    ): FutureData<{ trackedEntities: TrackedEntity[] }> {
        const eventsByStage: D2TrackerEvent[] = questionnaire.stages.map(stage => {
            const dataValuesByStage = stage.sections.flatMap(section => {
                return this.mapQuestionsToDataValues(section.questions);
            });

            return {
                program: programId,
                event: stage.instanceId ?? "",
                programStage: stage.code,
                orgUnit: orgUnitId,
                dataValues: dataValuesByStage as DataValue[],
                occurredAt: new Date().getTime().toString(),
                status: "ACTIVE",
            };
        });

        const attributes: D2TrackerEnrollmentAttribute[] = questionnaire.entity
            ? questionnaire.entity.questions.map(question => {
                  if (question.type === "select" && question.value) {
                      return {
                          attribute: question.id,
                          value: question.value.code ? question.value.code : "",
                      };
                  } else if (question.type === "date") {
                      return {
                          attribute: question.id,
                          value: question.value ? question.value : new Date(),
                      };
                  } else {
                      return {
                          attribute: question.id,
                          value: question.value ? question.value.toString() : "",
                      };
                  }
              })
            : [];

        const enrollments: D2TrackerEnrollment[] = [
            {
                orgUnit: orgUnitId,
                program: programId,
                enrollment: questionnaire.subLevelDetails?.enrollmentId ?? "",
                trackedEntityType: getTrackedEntityAttributeType(programId),
                notes: [],
                relationships: [],
                attributes: attributes,
                events: eventsByStage,
                enrolledAt: new Date().getTime().toString(),
                occurredAt: new Date().getTime().toString(),
                createdAt: new Date().getTime().toString(),
                createdAtClient: new Date().getTime().toString(),
                updatedAt: new Date().getTime().toString(),
                updatedAtClient: new Date().getTime().toString(),
                status: "ACTIVE",
                orgUnitName: "",
                followUp: false,
                deleted: false,
                storedBy: "",
            },
        ];

        const entity: TrackedEntity = {
            orgUnit: orgUnitId,
            trackedEntity: teiId ?? "",
            trackedEntityType: getTrackedEntityAttributeType(programId),
            enrollments: enrollments,
        };
        return Future.success({ trackedEntities: [entity] });
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
            const surveys = this.mapTrackedEntityToSurvey(trackedEntities, surveyFormType);
            return Future.success(surveys);
        });
    }

    mapTrackedEntityToSurvey(
        trackedEntities: TrackedEntitiesGetResponse,
        surveyFormType: SURVEY_FORM_TYPES
    ) {
        return trackedEntities.instances.map(trackedEntity => {
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

            const survey: Survey = {
                id: trackedEntity.trackedEntity ?? "",
                name: trackedEntity.trackedEntity ?? "",
                rootSurvey: {
                    id: parentPrevalenceSurveyId ?? "",
                    name: "",
                    surveyType: "",
                },
                startDate: trackedEntity.createdAt ? new Date(trackedEntity.createdAt) : undefined,
                status: "ACTIVE",
                assignedOrgUnit: {
                    id: trackedEntity.orgUnit ?? "",
                    name: "",
                },
                surveyType: "",
                parentWardRegisterId: undefined,
                surveyFormType: surveyFormType,
                childCount: undefined,
            };
            return survey;
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
            const surveys = this.mapEventToSurvey(events, surveyFormType, programId);
            return Future.success(surveys);
        });
    }

    mapEventToSurvey(
        events: D2TrackerEvent[],
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id
    ): Survey[] {
        return events.map((event: D2TrackerEvent) => {
            const surveyProperties = new Map(
                keyToDataElementMap.map(({ key, dataElements }) => {
                    const value =
                        event.dataValues.find(dv => dataElements.includes(dv.dataElement))?.value ??
                        "";

                    return [key, value] as const;
                })
            );

            const startDateStr = surveyProperties.get("startDate");
            const startDate = startDateStr ? new Date(startDateStr) : undefined;
            const surveyName = surveyProperties.get("surveyName") ?? "";
            const surveyCompleted = surveyProperties.get("surveyCompleted") ?? "";
            const hospitalCode = surveyProperties.get("hospitalCode") ?? "";
            const wardCode = surveyProperties.get("wardCode") ?? "";
            const patientCode = surveyProperties.get("patientCode") ?? "";
            const parentPPSSurveyId = surveyProperties.get("parentPPSSurveyId") ?? "";
            const surveyType = surveyProperties.get("surveyType") ?? "";
            const parentWardRegisterId = surveyProperties.get("parentWardRegisterId") ?? "";

            const status =
                surveyCompleted === "false" && startDate
                    ? startDate > new Date()
                        ? "FUTURE"
                        : "ACTIVE"
                    : "COMPLETED";

            const survey: Survey = {
                id: event.event,
                name: getSurveyNameBySurveyFormType(surveyFormType, {
                    eventId: event.event,
                    surveyName,
                    orgUnitName: event.orgUnitName,
                    hospitalCode,
                    wardCode,
                    patientCode,
                }),
                rootSurvey: {
                    id:
                        surveyFormType !== "PPSSurveyForm" &&
                        surveyFormType !== "PrevalenceSurveyForm"
                            ? parentPPSSurveyId
                            : event.event,
                    name:
                        surveyFormType !== "PPSSurveyForm" &&
                        surveyFormType !== "PrevalenceSurveyForm"
                            ? ""
                            : surveyName,
                    surveyType: surveyFormType === "PPSSurveyForm" ? surveyType : "",
                },
                startDate: startDate,
                status:
                    programId === PPS_SURVEY_FORM_ID || programId === PREVALENCE_SURVEY_FORM_ID
                        ? status
                        : event.status === "COMPLETED"
                        ? ("COMPLETED" as SURVEY_STATUSES)
                        : ("ACTIVE" as SURVEY_STATUSES),
                assignedOrgUnit: { id: event.orgUnit, name: event.orgUnitName ?? "" },
                surveyType: surveyType,
                parentWardRegisterId: parentWardRegisterId,
                surveyFormType: surveyFormType,
                childCount: undefined,
            };
            return survey;
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
    private getProgramRules(
        programRulesResponse: D2ProgramRule[] | undefined,
        programRuleVariables: D2ProgramRuleVariable[] | undefined,
        programRuleActionsResponse: D2ProgramRuleAction[] | undefined
    ): QuestionnaireRule[] {
        return (
            programRulesResponse?.map(({ id, condition, programRuleActions: actions }) => {
                const dataElementIds =
                    condition.match(/#{(.*?)}/g)?.map(programRuleVariableName => {
                        const variableName = programRuleVariableName.replace(/#{|}/g, "");

                        const dataElementId =
                            programRuleVariables?.find(
                                programRuleVariable => variableName === programRuleVariable.name
                            )?.dataElement?.id || "";

                        return dataElementId;
                    }) || [];

                const parsedCondition = condition.replace(/#{(.*?)}/g, (match, programRuleVar) => {
                    const dataElementId =
                        programRuleVariables?.find(
                            programRuleVariable => programRuleVariable.name === programRuleVar
                        )?.dataElement?.id || "";

                    return `#{${dataElementId}}`;
                });

                const programRuleActionIds: string[] = actions.map(action => action.id);

                const programRuleActions: D2ProgramRuleAction[] | undefined =
                    programRuleActionsResponse
                        ?.filter(programRuleAction =>
                            programRuleActionIds.includes(programRuleAction.id)
                        )
                        .map(programRuleAction => {
                            return {
                                id: programRuleAction.id,
                                programRuleActionType: programRuleAction.programRuleActionType,
                                data: programRuleAction.data,
                                dataElement: programRuleAction.dataElement,
                                programStageSection: {
                                    id: programRuleAction.programStageSection?.id,
                                },
                                programStage: {
                                    id: programRuleAction.programStage?.id,
                                },
                                content: programRuleAction.content,
                            };
                        });

                return {
                    id: id,
                    condition: parsedCondition,
                    dataElementIds: _(dataElementIds).uniq().value(),
                    actions: programRuleActions || [],
                };
            }) || []
        );
    }

    getSurveyChildCount(
        parentProgram: Id,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId: Id | undefined
    ): FutureData<number | ProgramCountMap> {
        const childIds = getChildProgramId(parentProgram);

        if (childIds && childIds[0]) {
            //As of now, all child programs for a given program are of the same type,
            //so we will check only the first child

            const childId = typeof childIds === "string" ? childIds : childIds[0];
            const isTracker = isTrackerProgram(childId);

            if (isTracker) {
                if (typeof childIds === "string") {
                    const eventCount = this.getTrackerSurveyCount(
                        childId,
                        orgUnitId,
                        parentSurveyId
                    );

                    return eventCount;
                } else {
                    const eventCounts = childIds.map(id => {
                        return this.getTrackerSurveyCount(id, orgUnitId, parentSurveyId).map(
                            count => {
                                return { id: id, count: count };
                            }
                        );
                    });

                    return Future.sequential(eventCounts);
                }
            } else {
                if (typeof childIds === "string") {
                    const eventCount = this.getEventSurveyCount(
                        childIds,
                        orgUnitId,
                        parentSurveyId,
                        secondaryparentId
                    );

                    return eventCount;
                } else {
                    return Future.error(
                        new Error(
                            "Event programs in AMR Surveys have single child. It should not contain multiple children"
                        )
                    );
                }
            }
        } else return Future.error(new Error("Unknown child program"));
    }

    private getEventSurveyCount(
        programId: Id,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryParentId: Id | undefined
    ): FutureData<number> {
        const ouId = programId === PPS_COUNTRY_QUESTIONNAIRE_ID ? "" : orgUnitId;
        const ouMode = programId === PPS_HOSPITAL_FORM_ID ? "DESCENDANTS" : undefined;
        const filterParentDEId = getParentDataElementForProgram(programId);

        const filterStr =
            secondaryParentId === ""
                ? `${filterParentDEId}:eq:${parentSurveyId}`
                : `${filterParentDEId}:eq:${secondaryParentId} `;

        return apiToFuture(
            this.api.tracker.events.get({
                fields: { event: true },
                program: programId,
                orgUnit: ouId,
                ouMode: ouMode,
                filter: filterStr,
            })
        ).flatMap(response => {
            return Future.success(response.instances.length);
        });
    }

    private getTrackerSurveyCount(
        programId: Id,
        orgUnitId: Id,
        parentSurveyId: Id
    ): FutureData<number> {
        const filterParentDEId = getParentDataElementForProgram(programId);

        const ouMode =
            orgUnitId !== "" && programId === PREVALENCE_FACILITY_LEVEL_FORM_ID
                ? "DESCENDANTS"
                : undefined;

        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: { trackedEntity: true },
                program: programId,
                orgUnit: orgUnitId,
                ouMode: ouMode,
                filter: `${filterParentDEId}:eq:${parentSurveyId}`,
            })
        ).flatMap((trackedEntities: TrackedEntitiesGetResponse) => {
            return Future.success(trackedEntities.instances.length);
        });
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
