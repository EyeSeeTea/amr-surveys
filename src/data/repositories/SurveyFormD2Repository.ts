import { D2Api } from "@eyeseetea/d2-api/2.36";
import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { Future } from "../../domain/entities/generic/Future";
import {
    BooleanQuestion,
    DateQuestion,
    NumberQuestion,
    Question,
    Questionnaire,
    SelectQuestion,
    TextQuestion,
} from "../../domain/entities/Questionnaire";
import { Id, Ref } from "../../domain/entities/Ref";
import { SurveyRepository } from "../../domain/repositories/SurveyRepository";
import { apiToFuture, FutureData } from "../api-futures";
import _ from "../../domain/entities/generic/Collection";
import {
    EventProgramDataElement,
    EventProgramMetadata,
    ImportStrategy,
    Option,
    EventProgram,
    ProgramStageSection,
    TrackedEntityAttibute,
} from "../../domain/entities/EventProgram";
import { Survey } from "../../domain/entities/Survey";
import { DataValue } from "@eyeseetea/d2-api";

//PPS Program Ids
export const PPS_SURVEY_FORM_ID = "OGOw5Kt3ytv";
export const PPS_COUNTRY_QUESTIONNAIRE_ID = "a4aYe2Eoaul";
export const PPS_HOSPITAL_FORM_ID = "mesnCzaLc7u";
export const PPS_PATIENT_REGISTER_ID = "GWcT6PN9NmI";
export const PPS_WARD_REGISTER_ID = "aIyAtgpYYrS";

//Data element Ids
const START_DATE_DATAELEMENT_ID = "OmkxlG2rNw3";
const SURVEY_TYPE_DATAELEMENT_ID = "Oyi27xcPzAY";
const SURVEY_COMPLETED_DATAELEMENT_ID = "KuGRIx3I16f";
export const SURVEY_ID_DATAELEMENT_ID = "JHw6Hs0T2Lb";

export class SurveyD2Repository implements SurveyRepository {
    constructor(private api: D2Api) {}

    getForm(programId: Id, eventId: Id | undefined): FutureData<Questionnaire> {
        return apiToFuture(
            this.api.request<EventProgramMetadata>({
                method: "get",
                //TODO: Changed programId to supranational, to be reverted after tests
                url: `/programs/igEDINFwytu/metadata.json?fields=programs,dataElements,programStageDataElements,programStageSections,trackedEntityAttributes`,
            })
        ).flatMap(resp => {
            if (resp.programs[0]) {
                const programDataElements = resp.programStageDataElements.map(
                    psde => psde.dataElement
                );

                //If event specified,populate the form
                if (eventId) {
                    //Get event from eventId
                    return this.getSurveyById(eventId).flatMap(event => {
                        if (resp.programs[0]) {
                            return Future.success(
                                this.mapProgramToQuestionnaire(
                                    resp.programs[0],
                                    event,
                                    programDataElements,
                                    resp.dataElements,
                                    resp.options,
                                    resp.programStageSections,
                                    resp.trackedEntityAttributes
                                )
                            );
                        } else {
                            return Future.error(new Error("Event Program not found"));
                        }
                    });
                }
                //return empty form
                else {
                    return Future.success(
                        this.mapProgramToQuestionnaire(
                            resp.programs[0],
                            undefined,
                            programDataElements,
                            resp.dataElements,
                            resp.options,
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
        program: EventProgram,
        event: D2TrackerEvent | undefined,
        programDataElements: Ref[],
        dataElements: EventProgramDataElement[],
        options: Option[],
        programStageSections?: ProgramStageSection[],
        trackedEntityAttributes?: TrackedEntityAttibute[]
    ): Questionnaire {
        //If the EventProgram has sections, fetch and use programStageSections
        const sections = programStageSections
            ? programStageSections.map(section => {
                  const questions: Question[] = this.mapProgramDataElementToQuestions(
                      section.dataElements,
                      dataElements,
                      options,
                      event
                  );

                  return {
                      title: section.name,
                      code: section.id,
                      questions: questions,
                      isVisible: true,
                  };
              })
            : //If the EventProgram has no sections, create a single section
              [
                  {
                      title: "Survey Info",
                      code: "",
                      questions: this.mapProgramDataElementToQuestions(
                          programDataElements,
                          dataElements,
                          options,
                          event
                      ),
                      isVisible: true,
                  },
              ];

        if (trackedEntityAttributes) {
            const profileQuestions: Question[] = this.mapTrackedAttributesToQuestions(
                trackedEntityAttributes,
                options
            );

            const profileSection = {
                title: "Profile",
                code: "PROFILE",
                questions: profileQuestions,
                isVisible: true,
            };

            sections.unshift(profileSection);
        }

        sections.sort((a, b) => a.title.localeCompare(b.title, "en", { numeric: true }));

        const form: Questionnaire = {
            id: program.id,
            name: program.name,
            description: program.name,
            orgUnit: { id: "" },
            year: "",
            isCompleted: false,
            isMandatory: false,
            rules: [],
            sections: sections,
        };
        return form;
    }

    private mapProgramDataElementToQuestions(
        sectionDataElements: { id: string }[],
        dataElements: EventProgramDataElement[],
        options: Option[],
        event: D2TrackerEvent | undefined = undefined
    ): Question[] {
        const questions: Question[] = _(
            sectionDataElements.map(dataElement => {
                const curDataEleemnt = dataElements.filter(de => de.id === dataElement.id);

                if (curDataEleemnt[0]) {
                    const dataElement = curDataEleemnt[0];
                    const dataValue = event
                        ? event.dataValues.find(dv => dv.dataElement === dataElement.id)
                        : undefined;
                    let currentQuestion;

                    switch (dataElement.valueType) {
                        case "BOOLEAN": {
                            const boolQ: BooleanQuestion = {
                                id: dataElement.id,
                                code: dataElement.code, //code
                                text: dataElement.formName, //formName
                                type: "boolean",
                                storeFalse: true,
                                value: dataValue
                                    ? dataValue.value === "true"
                                        ? true
                                        : false
                                    : true,
                            };
                            currentQuestion = boolQ;
                            break;
                        }

                        case "INTEGER": {
                            const intQ: NumberQuestion = {
                                id: dataElement.id,
                                code: dataElement.code, //code
                                text: dataElement.formName, //formName
                                type: "number",
                                numberType: "INTEGER",
                                value: dataValue ? dataValue.value : "",
                            };
                            currentQuestion = intQ;
                            break;
                        }

                        case "TEXT": {
                            if (dataElement.optionSet) {
                                const selectOptions = options.filter(
                                    op => op.optionSet.id === dataElement.optionSet?.id
                                );

                                const selectedOption = dataValue
                                    ? selectOptions.find(o => o.code === dataValue.value)
                                    : undefined;

                                const selectQ: SelectQuestion = {
                                    id: dataElement.id || "",
                                    code: dataElement.code || "",
                                    text: dataElement.formName || "",
                                    type: "select",
                                    options: selectOptions,
                                    value: selectedOption
                                        ? selectedOption
                                        : { name: "", id: "", code: "" },
                                };
                                currentQuestion = selectQ;
                                break;
                            } else {
                                const singleLineText: TextQuestion = {
                                    id: dataElement.id,
                                    code: dataElement.code,
                                    text: dataElement.formName,
                                    type: "text",
                                    value: dataValue ? (dataValue.value as string) : "",
                                    multiline: false,
                                };
                                currentQuestion = singleLineText;
                                break;
                            }
                        }

                        case "LONG_TEXT": {
                            const singleLineTextQ: TextQuestion = {
                                id: dataElement.id,
                                code: dataElement.code,
                                text: dataElement.formName,
                                type: "text",
                                value: dataValue ? (dataValue.value as string) : "",
                                multiline: true,
                            };
                            currentQuestion = singleLineTextQ;
                            break;
                        }

                        case "DATE": {
                            const dateQ: DateQuestion = {
                                id: dataElement.id,
                                code: dataElement.code,
                                text: dataElement.formName,
                                type: "date",
                                value: dataValue ? new Date(dataValue.value as string) : new Date(),
                            };
                            currentQuestion = dateQ;
                            break;
                        }
                    }
                    ///Disable Survey Id Question
                    if (currentQuestion && currentQuestion.id === SURVEY_ID_DATAELEMENT_ID) {
                        currentQuestion.disabled = true;
                    }
                    return currentQuestion;
                }
            })
        )
            .compact()
            .value();

        return questions;
    }

    private mapTrackedAttributesToQuestions(
        attributes: TrackedEntityAttibute[],
        options: Option[]
    ): Question[] {
        const questions: Question[] = _(
            attributes.map(attribute => {
                let currentQuestion;

                switch (attribute.valueType) {
                    case "BOOLEAN": {
                        const boolQ: BooleanQuestion = {
                            id: attribute.id,
                            code: attribute.code, //code
                            text: attribute.formName, //formName
                            type: "boolean",
                            storeFalse: true,
                            value: attribute ? (attribute.value === "true" ? true : false) : true,
                        };
                        currentQuestion = boolQ;
                        break;
                    }

                    case "TRUE_ONLY": {
                        const boolQ: BooleanQuestion = {
                            id: attribute.id,
                            code: attribute.code, //code
                            text: attribute.formName, //formName
                            type: "boolean",
                            storeFalse: true,
                            value: attribute ? (attribute.value === "true" ? true : false) : true,
                        };
                        currentQuestion = boolQ;
                        break;
                    }

                    case "INTEGER": {
                        const intQ: NumberQuestion = {
                            id: attribute.id,
                            code: attribute.code, //code
                            text: attribute.formName, //formName
                            type: "number",
                            numberType: "INTEGER",
                            value: attribute ? attribute.value : "",
                        };
                        currentQuestion = intQ;
                        break;
                    }

                    case "TEXT": {
                        if (attribute.optionSet) {
                            const selectOptions = options.filter(
                                op => op.optionSet.id === attribute.optionSet?.id
                            );

                            const selectedOption = attribute
                                ? selectOptions.find(o => o.code === attribute.value)
                                : undefined;

                            const selectQ: SelectQuestion = {
                                id: attribute.id || "",
                                code: attribute.code || "",
                                text: attribute.formName || "",
                                type: "select",
                                options: selectOptions,
                                value: selectedOption
                                    ? selectedOption
                                    : { name: "", id: "", code: "" },
                            };
                            currentQuestion = selectQ;
                            break;
                        } else {
                            const singleLineText: TextQuestion = {
                                id: attribute.id,
                                code: attribute.code,
                                text: attribute.formName,
                                type: "text",
                                value: attribute ? (attribute.value as string) : "",
                                multiline: false,
                            };
                            currentQuestion = singleLineText;
                            break;
                        }
                    }

                    case "LONG_TEXT": {
                        const singleLineTextQ: TextQuestion = {
                            id: attribute.id,
                            code: attribute.code,
                            text: attribute.formName,
                            type: "text",
                            value: attribute ? (attribute.value as string) : "",
                            multiline: true,
                        };
                        currentQuestion = singleLineTextQ;
                        break;
                    }

                    case "DATE": {
                        const dateQ: DateQuestion = {
                            id: attribute.id,
                            code: attribute.code,
                            text: attribute.formName,
                            type: "date",
                            value: attribute ? new Date(attribute.value as string) : new Date(),
                        };
                        currentQuestion = dateQ;
                        break;
                    }
                }
                ///Disable Survey Id Question
                if (currentQuestion && currentQuestion.id === SURVEY_ID_DATAELEMENT_ID) {
                    currentQuestion.disabled = true;
                }
                return currentQuestion;
            })
        )
            .compact()
            .value();

        return questions;
    }

    saveFormData(
        questionnaire: Questionnaire,
        action: ImportStrategy,
        orgUnitId: Id,
        eventId: string | undefined,
        programId: Id
    ): FutureData<void> {
        return this.mapQuestionnaireToEvent(questionnaire, orgUnitId, programId, eventId).flatMap(
            event => {
                return apiToFuture(
                    this.api.tracker.postAsync({ importStrategy: action }, { events: [event] })
                ).flatMap(response => {
                    return apiToFuture(
                        // eslint-disable-next-line testing-library/await-async-utils
                        this.api.system.waitFor("TRACKER_IMPORT_JOB", response.response.id)
                    ).flatMap(result => {
                        if (result) {
                            return Future.success(undefined);
                        } else {
                            return Future.error(
                                new Error("An error occured while saving the survey")
                            );
                        }
                    });
                });
            }
        );
    }

    private mapQuestionnaireToEvent(
        questionnaire: Questionnaire,
        orgUnitId: string,
        programId: Id,
        eventId: string | undefined = undefined
    ): FutureData<D2TrackerEvent> {
        const questions = questionnaire.sections.flatMap(section => section.questions);

        const dataValues = _(
            questions.map(q => {
                if (q) {
                    if (q.type === "select" && q.value) {
                        return {
                            dataElement: q.id,
                            value: q.value.code,
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
            return this.getSurveyById(eventId).flatMap(event => {
                const updatedEvent: D2TrackerEvent = {
                    ...event,

                    dataValues: dataValues as DataValue[],
                };
                return Future.success(updatedEvent);
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
            return Future.success(event);
        }
    }

    getSurveys(programId: Id, orgUnitId: Id): FutureData<Survey[]> {
        return apiToFuture(
            this.api.tracker.events.get({
                fields: { $all: true },
                program: programId,
                orgUnit: orgUnitId,
            })
        ).flatMap(events => {
            const surveys: Survey[] = events.instances.map(event => {
                const startDateString = event.dataValues.find(
                    dv => dv.dataElement === START_DATE_DATAELEMENT_ID
                )?.value;

                const surveyType = event.dataValues.find(
                    dv => dv.dataElement === SURVEY_TYPE_DATAELEMENT_ID
                )?.value;

                const surveyCompleted = event.dataValues.find(
                    dv => dv.dataElement === SURVEY_COMPLETED_DATAELEMENT_ID
                )?.value;

                const parentSurveyId = event.dataValues.find(
                    dv => dv.dataElement === SURVEY_ID_DATAELEMENT_ID
                )?.value;

                const startDate = startDateString ? new Date(startDateString) : undefined;
                const status =
                    surveyCompleted === "false" && startDate
                        ? startDate > new Date()
                            ? "FUTURE"
                            : "ACTIVE"
                        : "COMPLETED";

                return {
                    id: event.event,
                    parentSurveyId: parentSurveyId,
                    startDate: startDate,
                    status:
                        programId === PPS_SURVEY_FORM_ID
                            ? status
                            : event.status === "COMPLETED"
                            ? "COMPLETED"
                            : "ACTIVE",
                    assignedOrgUnit: { id: event.orgUnit, name: event.orgUnitName ?? "" },
                    surveyType: surveyType ? surveyType : "",
                };
            });

            return Future.success(surveys);
        });
    }

    private getSurveyById(eventId: string): FutureData<D2TrackerEvent> {
        return apiToFuture(
            this.api.tracker.events.getById(eventId, {
                fields: { $all: true },
            })
        ).flatMap(resp => {
            return Future.success(resp);
        });
    }
}
