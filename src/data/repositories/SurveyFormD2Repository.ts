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
} from "../../domain/entities/EventProgram";
import { Survey, SURVEY_FORM_TYPES, SURVEY_STATUSES } from "../../domain/entities/Survey";
import { DataValue } from "@eyeseetea/d2-api";
import { PaginatedReponse } from "../../domain/entities/TablePagination";

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
export const SURVEY_ID_PATIENT_DATAELEMENT_ID = "X2EkNfUHANO";
export const WARD_ID_DATAELEMENT_ID = "o4YMhVrXTeG";
const WARD2_ID_DATAELEMENT_ID = "aSI3ZfIb3YS";
const SURVEY_NAME_DATAELEMENT_ID = "mEQnAQQjdO8";
const SURVEY_HOSPITAL_CODE_DATAELEMENT_ID = "uAe6Mlw2XlE";
const SURVEY_WARD_CODE_DATAELEMENT_ID = "q4mg5z04dzd";
const SURVEY_PATIENT_CODE_DATAELEMENT_ID = "yScrOW1eTvm";

export class SurveyD2Repository implements SurveyRepository {
    constructor(private api: D2Api) {}

    getForm(programId: Id, eventId: Id | undefined): FutureData<Questionnaire> {
        return apiToFuture(
            this.api.request<EventProgramMetadata>({
                method: "get",
                url: `/programs/${programId}/metadata.json?fields=programs,dataElements,programStageDataElements,programStageSections`,
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
                        if (resp.programs[0] && event) {
                            return Future.success(
                                this.mapProgramToQuestionnaire(
                                    resp.programs[0],
                                    event,
                                    programDataElements,
                                    resp.dataElements,
                                    resp.options,
                                    resp.programStageSections
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
                            resp.programStageSections
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
        programStageSections?: ProgramStageSection[]
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
        const form: Questionnaire = {
            id: program.id,
            name: program.name,
            description: program.name,
            orgUnit: { id: event?.orgUnit ?? "" },
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
                    ///Disable Id fields which are auto generated.
                    if (
                        currentQuestion &&
                        (currentQuestion.id === SURVEY_ID_DATAELEMENT_ID ||
                            currentQuestion.id === SURVEY_ID_PATIENT_DATAELEMENT_ID ||
                            currentQuestion.id === WARD_ID_DATAELEMENT_ID ||
                            currentQuestion.id === WARD2_ID_DATAELEMENT_ID)
                    ) {
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
                        if (result && result.status !== "ERROR") {
                            return Future.success(undefined);
                        } else {
                            return Future.error(
                                new Error(
                                    `Error: ${
                                        result?.validationReport?.errorReports?.at(0)?.message
                                    } `
                                )
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
                if (event) {
                    const updatedEvent: D2TrackerEvent = {
                        ...event,

                        dataValues: dataValues as DataValue[],
                    };
                    return Future.success(updatedEvent);
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
            return Future.success(event);
        }
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
        orgUnitId: Id,
        parentWardRegisterId: Id | undefined,
        page: number,
        pageSize: number
    ): FutureData<PaginatedReponse<Survey[]>> {
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
                // Testing the API filter for now to see how the filtering performs
                ...(surveyFormType === "PPSPatientRegister" && {
                    page: page + 1,
                    pageSize,
                    totalPages: true,
                    filter: `${WARD_ID_DATAELEMENT_ID}:eq:${parentWardRegisterId}`,
                }),
            })
        ).flatMap(response => {
            const events = response.instances;

            const surveys = events.map(event => {
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
                    if (dv.dataElement === START_DATE_DATAELEMENT_ID) startDateString = dv.value;
                    if (dv.dataElement === SURVEY_TYPE_DATAELEMENT_ID) surveyType = dv.value;
                    if (dv.dataElement === SURVEY_COMPLETED_DATAELEMENT_ID)
                        surveyCompleted = dv.value;
                    if (
                        dv.dataElement === SURVEY_ID_DATAELEMENT_ID ||
                        dv.dataElement === SURVEY_ID_PATIENT_DATAELEMENT_ID
                    )
                        parentPPSSurveyId = dv.value;
                    if (dv.dataElement === WARD_ID_DATAELEMENT_ID) parentWardRegisterId = dv.value;
                    if (dv.dataElement === SURVEY_NAME_DATAELEMENT_ID) surveyName = dv.value;
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

                return this.getSurveyNameFromId(parentPPSSurveyId).map(parentppsSurveyName => {
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
                                surveyFormType !== "PPSSurveyForm"
                                    ? parentPPSSurveyId
                                    : event.event,
                            name:
                                surveyFormType !== "PPSSurveyForm"
                                    ? parentppsSurveyName
                                    : surveyName,
                            surveyType: surveyFormType === "PPSSurveyForm" ? surveyType : "",
                        },
                        startDate: startDate,
                        status:
                            programId === PPS_SURVEY_FORM_ID
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
                });
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

    getPopulatedSurveyById(eventId: Id, programId: Id): FutureData<Questionnaire> {
        return this.getForm(programId, eventId);
    }

    getSurveyById(eventId: string): FutureData<D2TrackerEvent | void> {
        return apiToFuture(
            this.api.tracker.events.getById(eventId, {
                fields: { $all: true },
            })
        ).flatMap(resp => {
            if (resp) return Future.success(resp);
            else return Future.success(undefined);
        });
    }

    getSurveyNameFromId(id: Id): FutureData<string> {
        if (id !== "")
            return this.getSurveyById(id).flatMap(survey => {
                if (survey) {
                    const surveyName = survey.dataValues?.find(
                        dv => dv.dataElement === SURVEY_NAME_DATAELEMENT_ID
                    )?.value;

                    return Future.success(surveyName ?? "");
                } else return Future.success("");
            });
        else return Future.success("");
    }
}
