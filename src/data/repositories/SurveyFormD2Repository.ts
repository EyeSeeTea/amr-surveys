import { D2Api } from "@eyeseetea/d2-api/2.36";
import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { Future } from "../../domain/entities/generic/Future";
import {
    BooleanQuestion,
    DateQuestion,
    DateTimeQuestion,
    NumberQuestion,
    Question,
    Questionnaire,
    QuestionnaireEntity,
    QuestionnaireSection,
    QuestionnaireStage,
    SelectQuestion,
    TextQuestion,
} from "../../domain/entities/Questionnaire";
import { Id, Ref } from "../../domain/entities/Ref";
import { SurveyRepository } from "../../domain/repositories/SurveyRepository";
import { apiToFuture, FutureData } from "../api-futures";
import _ from "../../domain/entities/generic/Collection";
import {
    ProgramDataElement,
    ProgramMetadata,
    ImportStrategy,
    Option,
    Program,
    ProgramStageSection,
    TrackedEntityAttibute,
    ProgramStage,
} from "../../domain/entities/Program";
import { Survey, SURVEY_FORM_TYPES, SURVEY_STATUSES } from "../../domain/entities/Survey";
import { DataValue } from "@eyeseetea/d2-api";
import { D2TrackerTrackedEntity as TrackedEntity } from "@eyeseetea/d2-api/api/trackerTrackedEntities";
import {
    D2TrackerEnrollment,
    D2TrackerEnrollmentAttribute,
} from "@eyeseetea/d2-api/api/trackerEnrollments";

//PPS Program Ids
export const PPS_SURVEY_FORM_ID = "OGOw5Kt3ytv";
export const PPS_COUNTRY_QUESTIONNAIRE_ID = "a4aYe2Eoaul";
export const PPS_HOSPITAL_FORM_ID = "mesnCzaLc7u";
export const PPS_PATIENT_REGISTER_ID = "GWcT6PN9NmI";
export const PPS_WARD_REGISTER_ID = "aIyAtgpYYrS";

//PPS Data element Ids
const START_DATE_DATAELEMENT_ID = "OmkxlG2rNw3";
const SURVEY_TYPE_DATAELEMENT_ID = "Oyi27xcPzAY";
const SURVEY_COMPLETED_DATAELEMENT_ID = "KuGRIx3I16f";
export const SURVEY_ID_DATAELEMENT_ID = "JHw6Hs0T2Lb";
export const SURVEY_ID_PATIENT_DATAELEMENT_ID = "X2EkNfUHANO";
export const WARD_ID_DATAELEMENT_ID = "o4YMhVrXTeG";
const WARD2_ID_DATAELEMENT_ID = "aSI3ZfIb3YS";
const SURVEY_NAME_DATAELEMENT_ID = "mEQnAQQjdO8";
const SURVEY_HOSPITAL_CODE_DATAELEMENT_ID = "uAe6Mlw2XlE";
const SURVEY_WARD_CODE_DATAELEMENT_ID = "q4mg5z04dzd";
const SURVEY_PATIENT_CODE_DATAELEMENT_ID = "yScrOW1eTvm";

//Prevalance Program Ids
export const PREVALENCE_SURVEY_FORM_ID = "WcSw803XiUk";
export const PREVALENCE_FACILITY_LEVEL_FORM_ID = "m404pwBZ4YT";
export const PREVALENCE_CASE_REPORT_FORM_ID = "i0msBbbQxYC";
export const PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID = "ew0mOwKdcJp";
export const PREVALENCE_CENTRAL_REF_LAB_FORM_ID = "aaAzYmn5vBG";
export const PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID = "KActa6iTwIM";
export const PREVALENCE_SUPRANATIONAL_REF_LAB_ID = "igEDINFwytu";

//Prevalence Data element Ids
const AMR_SURVEYS_PREVALENCE_DEA_SURVEY_ID = "o6oNnIbpPDH";
export const SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID = "Log2Y4uqBBo";
const PREVALENCE_START_DATE_DATAELEMENT_ID = "xlvLBmg9Mkg";
const PREVELANCE_SURVEY_COMPLETED_DATAELEMENT_ID = "xiFcLr23IbW";
const PREVELANCE_SURVEY_NAME_DATAELEMENT_ID = "HXnhZ8rsDts";

///Prevelance Tracked Entity Attribute types
export const PREVALANCE_SUPRANATIONAL_TET = "KQMBM3q32FC";
export const PREVALANCE_FACILITY_LEVEL_TET = "eY4BDBKXegX";

//Data Elements to hide
const hiddenFields = ["Add new antibiotic"];
const programsWithRepeatableSections = [PREVALENCE_SUPRANATIONAL_REF_LAB_ID];

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
                url: `/programs/${programId}/metadata.json?fields=programs,dataElements,programStageDataElements,programStageSections,trackedEntityAttributes,programStages`,
            })
        ).flatMap(resp => {
            if (resp.programs[0]) {
                const programDataElements = resp.programStageDataElements.map(
                    psde => psde.dataElement
                );

                //If event specified,populate the form
                if (eventId) {
                    if (this.isTrackerProgram(programId)) {
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
                                            resp.dataElements,
                                            resp.options,
                                            resp.programStages,
                                            resp.programStageSections,
                                            resp.trackedEntityAttributes
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
                                        resp.dataElements,
                                        resp.options,
                                        resp.programStages,
                                        resp.programStageSections,
                                        resp.trackedEntityAttributes
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
                            resp.dataElements,
                            resp.options,
                            resp.programStages,
                            resp.programStageSections,
                            resp.trackedEntityAttributes
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
        trackedEntityAttributes?: TrackedEntityAttibute[]
    ): Questionnaire {
        //If the Program has sections, fetch and use programStageSections
        const sections: QuestionnaireSection[] = programStageSections
            ? programStageSections.map(section => {
                  const { questions, sectionAddQuestion } = this.mapProgramDataElementToQuestions(
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
                      showAddQuestion: sectionAddQuestion,
                  };
              })
            : //If the Program has no sections, create a single section
              [
                  {
                      title: "Survey Info",
                      code: "default",
                      questions: this.mapProgramDataElementToQuestions(
                          programDataElements,
                          dataElements,
                          options,
                          event,
                          trackedEntity
                      ).questions,
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

                  //check if current program has repeatable Questions.
                  if (programsWithRepeatableSections.find(p => p === program.id)) {
                      const groupedProgramStageSections = _(currentProgramStageSections)
                          .sortBy(s => s.sortOrder)
                          .groupBy(section =>
                              section.title.substring(0, section.title.lastIndexOf(" "))
                          );

                      const processedSections: QuestionnaireSection[] = [];
                      groupedProgramStageSections.forEach(group => {
                          if (group[1].length > 1) {
                              const currentSectionGroup: QuestionnaireSection[] = group[1].map(
                                  (section, index) => {
                                      return {
                                          ...section,
                                          isVisible: index === 0 ? true : false,
                                          showAddnew: true,
                                      };
                                  }
                              );
                              processedSections.push(...currentSectionGroup);
                          } else processedSections.push(...group[1]);
                      });

                      return {
                          title: stage.name,
                          code: stage.id,
                          sections: processedSections,
                          isVisible: true,
                      };
                  } else {
                      // no need for grouping and hiding logic
                      return {
                          title: stage.name,
                          code: stage.id,
                          sections: currentProgramStageSections,
                          isVisible: true,
                      };
                  }
              })
            : //If the Program has no stages, create a single stage
              [
                  {
                      title: "STAGE",
                      code: "STAGE",
                      sections: sections,
                      isVisible: true,
                  },
              ];

        const orgUnitId = this.isTrackerProgram(program.id)
            ? trackedEntity?.orgUnit ?? ""
            : event?.orgUnit ?? "";

        const form: Questionnaire = {
            id: program.id,
            name: program.name,
            description: program.name,
            orgUnit: { id: orgUnitId },
            year: "",
            isCompleted: false,
            isMandatory: false,
            rules: [],
            stages: stages.sort((a, b) => a.title.localeCompare(b.title, "en", { numeric: true })),
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
        sectionDataElements: { id: string }[],
        dataElements: ProgramDataElement[],
        options: Option[],
        event: D2TrackerEvent | undefined = undefined,
        trackedEntity: TrackedEntity | undefined = undefined
    ): { questions: Question[]; sectionAddQuestion: string } {
        let sectionAddQuestion = "";
        const questions: Question[] = _(
            sectionDataElements.map(dataElement => {
                const curDataEleemnt = dataElements.filter(de => de.id === dataElement.id);

                if (curDataEleemnt[0]) {
                    const dataElement = curDataEleemnt[0];

                    const eventDataValue = event
                        ? event.dataValues.find(dv => dv.dataElement === dataElement.id)
                        : undefined;

                    const trackedEntityDataValue = trackedEntity?.enrollments?.flatMap(
                        enrollment => {
                            return enrollment.events.flatMap(e => {
                                return e.dataValues.find(dv => dv.dataElement === dataElement.id);
                            });
                        }
                    );

                    const currentQuestion = this.getQuestion(
                        dataElement.valueType,
                        dataElement.id,
                        dataElement.code,
                        dataElement.formName,
                        options,
                        dataElement.optionSet,
                        eventDataValue
                            ? eventDataValue.value
                            : trackedEntityDataValue
                            ? trackedEntityDataValue[0]?.value
                            : ""
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

                    //Some field was hidden, set it as label
                    if (currentQuestion?.isVisible === false) {
                        const LsectionAddLabel = hiddenFields.find(
                            field => field === currentQuestion.text
                        );

                        if (LsectionAddLabel) {
                            sectionAddQuestion = currentQuestion.id;
                        }
                    }

                    return currentQuestion;
                }
            })
        )
            .compact()
            .value();

        return { questions, sectionAddQuestion: sectionAddQuestion };
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
                    options,
                    attribute.optionSet,
                    attributeValue?.value
                );
                if (
                    currentQuestion &&
                    currentQuestion.id === SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID
                ) {
                    currentQuestion.disabled = true;
                }
                return currentQuestion;
            })
        )
            .compact()
            .value();

        return questions;
    }

    private getQuestion(
        valueType: string,
        id: Id,
        code: string,
        formName: string,
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
                    isVisible: hiddenFields.some(field => field === formName) ? false : true,
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
                    value: dataValue ? (dataValue === "true" ? true : false) : false,
                    isVisible: hiddenFields.some(field => field === formName) ? false : true,
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
                    isVisible: hiddenFields.some(field => field === formName) ? false : true,
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
                        isVisible: hiddenFields.some(field => field === formName) ? false : true,
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
                        isVisible: hiddenFields.some(field => field === formName) ? false : true,
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
                    isVisible: hiddenFields.some(field => field === formName) ? false : true,
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
                    isVisible: hiddenFields.some(field => field === formName) ? false : true,
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
                    isVisible: hiddenFields.some(field => field === formName) ? false : true,
                };
                return dateQ;
            }
        }
    }

    private isTrackerProgram(programId: Id) {
        switch (programId) {
            case PREVALENCE_FACILITY_LEVEL_FORM_ID:
            case PREVALENCE_CASE_REPORT_FORM_ID:
            case PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID:
            case PREVALENCE_CENTRAL_REF_LAB_FORM_ID:
            case PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID:
            case PREVALENCE_SUPRANATIONAL_REF_LAB_ID:
                return true;
            default:
                return false;
        }
    }

    private getTrackedEntityAttributeType(programId: Id) {
        switch (programId) {
            case PREVALENCE_SUPRANATIONAL_REF_LAB_ID:
                return PREVALANCE_SUPRANATIONAL_TET;
            case PREVALENCE_FACILITY_LEVEL_FORM_ID:
                return PREVALANCE_FACILITY_LEVEL_TET;
            default:
                return "";
        }
    }

    saveFormData(
        questionnaire: Questionnaire,
        action: ImportStrategy,
        orgUnitId: Id,
        eventId: string | undefined,
        programId: Id
    ): FutureData<void> {
        const $payload = this.isTrackerProgram(programId)
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

    private mapQuestionnaireToEvent(
        questionnaire: Questionnaire,
        orgUnitId: string,
        programId: Id,
        eventId: string | undefined = undefined
    ): FutureData<{ events: D2TrackerEvent[] }> {
        const questions = questionnaire.stages.flatMap(stages =>
            stages.sections.flatMap(section => section.questions)
        );

        const dataValues = _(
            questions.map(q => {
                if (q) {
                    if (q.type === "select" && q.value) {
                        return {
                            dataElement: q.id,
                            value: q.value.code,
                        };
                    } else if (q.type === "boolean" && q.storeFalse === false) {
                        return {
                            dataElement: q.id,
                            value: q.value ? q.value : undefined,
                        };
                    } else {
                        return {
                            dataElement: q.id,
                            value: q.value,
                        };
                    }
                }
            })
        )
            .compact()
            .value();

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
        _eventId: string | undefined = undefined
    ): FutureData<{ trackedEntities: TrackedEntity[] }> {
        const eventsByStage: D2TrackerEvent[] = questionnaire.stages.map(stage => {
            const dataValuesByStage: { dataElement: string; value: string }[] =
                stage.sections.flatMap(section => {
                    return section.questions.map(question => {
                        if (question.type === "select" && question.value) {
                            return {
                                dataElement: question.id,
                                value: question.value.code ? question.value.code : "",
                            };
                        } else {
                            return {
                                dataElement: question.id,
                                value: question.value ? question.value.toString() : "",
                            };
                        }
                    });
                });

            return {
                program: programId,
                event: "",
                programStage: stage.code,
                orgUnit: orgUnitId,
                dataValues: dataValuesByStage,
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
                enrollment: "",
                trackedEntityType: this.getTrackedEntityAttributeType(programId),
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
            trackedEntity: "",
            trackedEntityType: this.getTrackedEntityAttributeType(programId),
            enrollments: enrollments,
        };
        return Future.success({ trackedEntities: [entity] });
    }

    getSurveyNameBySurveyFormType(
        surveyFormType: SURVEY_FORM_TYPES,
        options: {
            eventId: string;
            surveyName: string;
            orgUnitName: string | undefined;
            hospitalCode: string;
            wardCode: string;
            patientCode: string;
        }
    ): string {
        switch (surveyFormType) {
            case "PPSSurveyForm":
                return options.surveyName !== "" ? options.surveyName : options.eventId;
            case "PPSCountryQuestionnaire":
                return options.orgUnitName && options.orgUnitName !== ""
                    ? options.orgUnitName
                    : options.eventId;
            case "PPSHospitalForm":
                return options.hospitalCode !== "" ? options.hospitalCode : options.eventId;
            case "PPSWardRegister":
                return options.wardCode !== "" ? options.wardCode : options.eventId;
            case "PPSPatientRegister":
                return options.patientCode !== "" ? options.patientCode : options.eventId;
            default:
                return "";
        }
    }

    getSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id
    ): FutureData<Survey[]> {
        return this.isTrackerProgram(programId)
            ? this.getTrackerProgramSurveys(surveyFormType, programId, orgUnitId)
            : this.getEventProgramSurveys(surveyFormType, programId, orgUnitId);
    }

    getTrackerProgramSurveys(
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
                fields: { $all: true },
                program: programId,
                orgUnit: orgUnitId,
                ouMode: ouMode,
            })
        ).flatMap(trackedEntities => {
            const surveys = trackedEntities.instances.map(trackedEntity => {
                const parentPrevalenceSurveyId =
                    trackedEntity.attributes?.find(
                        attribute => attribute.attribute === SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID
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

            return Future.sequential(surveys);
        });
    }

    getEventProgramSurveys(
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
        ).flatMap(events => {
            const surveys = events.instances.map(event => {
                let startDateString,
                    surveyType = "",
                    surveyCompleted,
                    parentPPSSurveyId = "",
                    parentWardRegisterId = "",
                    surveyName = "",
                    hospitalCode = "",
                    wardCode = "",
                    patientCode = "";

                event.dataValues.forEach(dv => {
                    if (
                        dv.dataElement === START_DATE_DATAELEMENT_ID ||
                        dv.dataElement === PREVALENCE_START_DATE_DATAELEMENT_ID
                    )
                        startDateString = dv.value;

                    if (dv.dataElement === SURVEY_TYPE_DATAELEMENT_ID) surveyType = dv.value;

                    if (
                        dv.dataElement === SURVEY_COMPLETED_DATAELEMENT_ID ||
                        dv.dataElement === PREVELANCE_SURVEY_COMPLETED_DATAELEMENT_ID
                    )
                        surveyCompleted = dv.value;

                    if (
                        dv.dataElement === SURVEY_ID_DATAELEMENT_ID ||
                        dv.dataElement === SURVEY_ID_PATIENT_DATAELEMENT_ID ||
                        dv.dataElement === AMR_SURVEYS_PREVALENCE_DEA_SURVEY_ID
                    )
                        parentPPSSurveyId = dv.value;

                    if (dv.dataElement === WARD_ID_DATAELEMENT_ID) parentWardRegisterId = dv.value;
                    if (
                        dv.dataElement === SURVEY_NAME_DATAELEMENT_ID ||
                        dv.dataElement === PREVELANCE_SURVEY_NAME_DATAELEMENT_ID
                    )
                        surveyName = dv.value;

                    if (dv.dataElement === SURVEY_HOSPITAL_CODE_DATAELEMENT_ID)
                        hospitalCode = dv.value;
                    if (dv.dataElement === SURVEY_WARD_CODE_DATAELEMENT_ID) wardCode = dv.value;
                    if (dv.dataElement === SURVEY_PATIENT_CODE_DATAELEMENT_ID)
                        patientCode = dv.value;
                });

                const startDate = startDateString ? new Date(startDateString) : undefined;
                const status =
                    surveyCompleted === "false" && startDate
                        ? startDate > new Date()
                            ? "FUTURE"
                            : "ACTIVE"
                        : "COMPLETED";

                return this.getSurveyNameFromId(parentPPSSurveyId, "PPS").map(
                    parentppsSurveyName => {
                        const survey: Survey = {
                            id: event.event,
                            name: this.getSurveyNameBySurveyFormType(surveyFormType, {
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
                                        ? parentppsSurveyName
                                        : surveyName,
                                surveyType: surveyFormType === "PPSSurveyForm" ? surveyType : "",
                            },
                            startDate: startDate,
                            status:
                                programId === PPS_SURVEY_FORM_ID ||
                                programId === PREVALENCE_SURVEY_FORM_ID
                                    ? status
                                    : event.status === "COMPLETED"
                                    ? ("COMPLETED" as SURVEY_STATUSES)
                                    : ("ACTIVE" as SURVEY_STATUSES),
                            assignedOrgUnit: { id: event.orgUnit, name: event.orgUnitName ?? "" },
                            surveyType: surveyType,
                            parentWardRegisterId: parentWardRegisterId,
                            surveyFormType: surveyFormType,
                        };
                        return survey;
                    }
                );
            });

            return Future.sequential(surveys);
        });
    }

    getPopulatedSurveyById(
        eventId: Id,
        programId: Id,
        orgUnitId: Id | undefined
    ): FutureData<Questionnaire> {
        if (this.isTrackerProgram(programId) && !orgUnitId)
            return Future.error(new Error("Unable to find survey"));
        return this.getForm(programId, eventId, orgUnitId);
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

    getTrackerProgramById(
        trackedEntityId: Id,
        programId: Id,
        orgUnitId: Id
    ): FutureData<TrackedEntity | void> {
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                orgUnit: orgUnitId,
                fields: { attributes: true, enrollments: true, trackedEntity: true, orgUnit: true },
                program: programId,
                trackedEntity: trackedEntityId,
                ouMode: "DESCENDANTS",
            })
        ).flatMap(resp => {
            if (resp) return Future.success(resp.instances[0]);
            else return Future.success(undefined);
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
}
