import { DataValue } from "@eyeseetea/d2-api";
import {
    AntibioticQuestion,
    BooleanQuestion,
    DateQuestion,
    DateTimeQuestion,
    NumberQuestion,
    Question,
    QuestionBase,
    SelectQuestion,
    SpeciesQuestion,
    TextQuestion,
} from "../../domain/entities/Questionnaire/QuestionnaireQuestion";
import { Id } from "../../domain/entities/Ref";
import { Option, ProgramDataElement, TrackedEntityAttibute } from "../entities/D2Program";
import {
    AMR_SURVEYS_MORTALITY_TEA_PAT_ID_COH2,
    AMR_SURVEYS_MORTALITY_TEA_PAT_ID_DF2,
    AMR_SURVEYS_MORTALITY_TEA_PAT_ID_FUP2,
    AMR_SURVEYS_PREVALENCE_DEA_SURVEY_ID,
    AMR_SURVEYS_PREVALENCE_TEA_AMRPATIENT_IDPREVALENCE,
    AMR_SURVEYS_PREVALENCE_TEA_PATIENT_ID,
    AMR_SURVEYS_PREVALENCE_TEA_PATIENT_IDA19,
    SURVEY_ID_DATAELEMENT_ID,
    SURVEY_ID_PATIENT_TEA_ID,
    WARD2_ID_DATAELEMENT_ID,
    WARD_ID_TEA_ID,
    parentPrevalenceSurveyIdList,
} from "../entities/D2Survey";
import _ from "../../domain/entities/generic/Collection";
import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { D2TrackerTrackedEntity as TrackedEntity } from "@eyeseetea/d2-api/api/trackerTrackedEntities";
import { isValidDate } from "../../utils/dates";
import i18n from "../../utils/i18n";

const SPECIES_QUESTION_FORNAME = "Specify the specie";
const ANTIBIOTIC_QUESTION_FORNAME = "Specify the antibiotic";
const getQuestionBase = (
    id: Id,
    code: string | undefined,
    name: string,
    formName: string | undefined,
    sortOrder: number | undefined
): QuestionBase => {
    if (formName === undefined || code === undefined) {
        throw new Error(
            i18n.t('There was a problem with "{{name}}" - {{prop}} is not set', {
                name,
                prop: formName === undefined ? "Form Name" : "Code",
            })
        );
    }
    return {
        id: id,
        code: code,
        name: name,
        text: formName,
        isVisible: true,
        sortOrder: sortOrder,
        errors: [],
    };
};

const getSelectQuestionBase = (
    base: QuestionBase,
    options: Option[],
    optionSet?: { id: string },
    dataValue?: string
) => {
    const selectOptions = options.filter(op => op.optionSet.id === optionSet?.id);

    const selectedOption = dataValue ? selectOptions.find(o => o.code === dataValue) : undefined;

    const selectQ: SelectQuestion = {
        ...base,
        type: "select",
        options: selectOptions,
        value: selectedOption ? selectedOption : { name: "", id: "", code: "" },
    };
    return selectQ;
};

export const getQuestion = (
    valueType: string,
    id: Id,
    code: string | undefined,
    name: string,
    formName: string | undefined,
    sortOrder: number | undefined,
    options: Option[],
    optionSet?: { id: string },
    dataValue?: string
): Question | undefined => {
    const base = getQuestionBase(id, code, name, formName, sortOrder);
    switch (valueType) {
        case "BOOLEAN": {
            const boolQ: BooleanQuestion = {
                ...base,
                type: "boolean",
                storeFalse: true,
                value: !dataValue || dataValue === "true",
            };
            return boolQ;
        }
        case "TRUE_ONLY": {
            const boolQ: BooleanQuestion = {
                ...base,
                type: "boolean",
                storeFalse: false,
                value: dataValue ? (dataValue === "true" ? true : undefined) : undefined,
            };
            return boolQ;
        }

        case "NUMBER":
        case "INTEGER":
        case "INTEGER_ZERO_OR_POSITIVE":
        case "INTEGER_NEGATIVE":
        case "INTEGER_POSITIVE": {
            const intQ: NumberQuestion = {
                ...base,
                type: "number",
                numberType: valueType,
                value: dataValue ? dataValue : "",
            };
            return intQ;
        }

        case "PHONE_NUMBER":
        case "EMAIL":
        case "TEXT": {
            if (optionSet) {
                const isSpeciesQuestion = formName?.includes(SPECIES_QUESTION_FORNAME) ?? false;
                const isAntibioticQuestion = name.startsWith(ANTIBIOTIC_QUESTION_FORNAME);

                const selectBase = getSelectQuestionBase(base, options, optionSet, dataValue);

                if (isSpeciesQuestion) {
                    const speciesQ: SpeciesQuestion = {
                        ...selectBase,
                        subType: "select-species",
                    };
                    return speciesQ;
                } else if (isAntibioticQuestion) {
                    const antibioticQ: AntibioticQuestion = {
                        ...selectBase,
                        subType: "select-antibiotic",
                    };
                    return antibioticQ;
                } else {
                    return getSelectQuestionBase(base, options, optionSet, dataValue);
                }
            } else {
                const singleLineText: TextQuestion = {
                    ...base,
                    type: "text",
                    value: dataValue ? (dataValue as string) : "",
                    multiline: false,
                };
                return singleLineText;
            }
        }

        case "LONG_TEXT": {
            const singleLineTextQ: TextQuestion = {
                ...base,
                type: "text",
                value: dataValue ? (dataValue as string) : "",
                multiline: true,
            };
            return singleLineTextQ;
        }

        case "DATE": {
            const dateQ: DateQuestion = {
                ...base,
                type: "date",
                value: parseQuestionDate(dataValue, base),
            };
            return dateQ;
        }

        case "DATETIME": {
            const dateQ: DateTimeQuestion = {
                ...base,
                type: "datetime",
                value: parseQuestionDate(dataValue, base),
            };
            return dateQ;
        }
    }
};

const parseQuestionDate = (
    dateStr: string | undefined,
    question: QuestionBase
): Date | undefined => {
    if (!dateStr) return undefined;
    const result = isValidDate(new Date(dateStr)) ? new Date(dateStr) : undefined;
    if (dateStr && !result) {
        console.debug(`Invalid date value: ${dateStr}`, question);
    }
    return result;
};

export const mapQuestionsToDataValues = (questions: Question[]): DataValue[] => {
    const dataValues = _(
        questions.map(question => {
            const baseQuestion = {
                lastUpdated: new Date().toISOString(),
                storedBy: "",
                created: "",
                providedElsewhere: false,
            };
            if (question) {
                if (question.type === "select" && question.value) {
                    return {
                        ...baseQuestion,
                        dataElement: question.id,
                        value: question.value.code ?? "",
                    };
                } else if (
                    (question.type === "date" || question.type === "datetime") &&
                    question.value
                ) {
                    return {
                        ...baseQuestion,
                        dataElement: question.id,
                        value: question.value.toISOString(),
                    };
                } else if (question.type === "boolean" && question.storeFalse === false) {
                    return {
                        ...baseQuestion,
                        dataElement: question.id,
                        value: question.value ? "true" : "",
                    };
                } else {
                    return {
                        ...baseQuestion,
                        dataElement: question.id,
                        value: question.value ? question.value.toString() : "",
                    };
                }
            }
        })
    )
        .compact()
        .value();

    return dataValues;
};

export const mapProgramDataElementToQuestions = (
    isTrackerProgram: boolean,
    sectionDataElements: { id: string }[],
    dataElements: ProgramDataElement[],
    options: Option[],
    event: D2TrackerEvent | undefined = undefined,
    trackedEntity: TrackedEntity | undefined = undefined
): Question[] => {
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
                        ? event.dataValues.find(dv => dv.dataElement === curDataElement.id)?.value
                        : undefined;
                }

                const currentQuestion = getQuestion(
                    curDataElement.valueType,
                    curDataElement.id,
                    curDataElement.code,
                    curDataElement.name,
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
};

export const mapRepeatedStageEventToQuestions = (
    sectionDataElements: { id: string }[],
    dataElements: ProgramDataElement[],
    options: Option[],
    event: D2TrackerEvent
): Question[] => {
    const questions: Question[] = _(
        sectionDataElements.map(dataElement => {
            const curDataElement = dataElements.find(de => de.id === dataElement.id);

            if (curDataElement) {
                const dataValue = event.dataValues.find(
                    dv => dv.dataElement === curDataElement.id
                )?.value;

                const currentQuestion = getQuestion(
                    curDataElement.valueType,
                    curDataElement.id,
                    curDataElement.code,
                    curDataElement.name,
                    curDataElement.formName,
                    curDataElement.sortOrder,
                    options,
                    curDataElement.optionSet,
                    dataValue ?? ""
                );

                return currentQuestion;
            }
        })
    )
        .compact()
        .value();

    return questions;
};

export const mapTrackedAttributesToQuestions = (
    attributes: TrackedEntityAttibute[],
    options: Option[],
    trackedEntity: TrackedEntity | undefined
): Question[] => {
    const questions: Question[] = _(
        attributes.map(attribute => {
            const attributeValue = trackedEntity?.attributes?.find(
                attr => attr.attribute === attribute.id
            );

            const currentQuestion = getQuestion(
                attribute.valueType,
                attribute.id,
                attribute.code,
                attribute.name,
                attribute.formName,
                attribute.sortOrder,
                options,
                attribute.optionSet,
                attributeValue?.value
            );
            if (
                currentQuestion &&
                (parentPrevalenceSurveyIdList.includes(currentQuestion.id) ||
                    // TODO: check if patientIdList can be used here (not all IDs overlap)
                    currentQuestion.id === AMR_SURVEYS_PREVALENCE_TEA_PATIENT_ID ||
                    currentQuestion.id === AMR_SURVEYS_PREVALENCE_TEA_AMRPATIENT_IDPREVALENCE ||
                    currentQuestion.id === AMR_SURVEYS_PREVALENCE_TEA_PATIENT_IDA19 ||
                    currentQuestion.id === AMR_SURVEYS_MORTALITY_TEA_PAT_ID_FUP2 ||
                    currentQuestion.id === AMR_SURVEYS_MORTALITY_TEA_PAT_ID_DF2 ||
                    currentQuestion.id === AMR_SURVEYS_MORTALITY_TEA_PAT_ID_COH2 ||
                    currentQuestion.id === SURVEY_ID_PATIENT_TEA_ID ||
                    currentQuestion.id === WARD_ID_TEA_ID)
            ) {
                currentQuestion.disabled = true;
            }
            return currentQuestion;
        })
    )
        .compact()
        .value();

    return questions;
};
