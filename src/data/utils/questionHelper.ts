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
    AMR_SURVEYS_PREVALENCE_DEA_SURVEY_ID,
    AMR_SURVEYS_PREVALENCE_TEA_PATIENT_ID,
    AMR_SURVEYS_PREVALENCE_TEA_PATIENT_IDA19,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF,
    SURVEY_ID_DATAELEMENT_ID,
    SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID,
    SURVEY_ID_PATIENT_DATAELEMENT_ID,
    WARD2_ID_DATAELEMENT_ID,
    WARD_ID_DATAELEMENT_ID,
} from "../entities/D2Survey";
import _ from "../../domain/entities/generic/Collection";
import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { D2TrackerTrackedEntity as TrackedEntity } from "@eyeseetea/d2-api/api/trackerTrackedEntities";

const SPECIES_QUESTION_FORNAME = "Specify the specie";
const ANTIBIOTIC_QUESTION_FORNAME = "Specify the antibiotic";
const getQuestionBase = (
    id: Id,
    code: string,
    name: string,
    formName: string,
    sortOrder: number | undefined
): QuestionBase => {
    return {
        id: id,
        code: code, //code
        name: name,
        text: formName, //formName
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
    code: string,
    name: string,
    formName: string,
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
        case "INTEGER": {
            const intQ: NumberQuestion = {
                ...base,
                type: "number",
                numberType: "INTEGER",
                value: dataValue ? dataValue : "",
            };
            return intQ;
        }

        case "PHONE_NUMBER":
        case "EMAIL":
        case "TEXT": {
            if (optionSet) {
                const isSpeciesQuestion = formName.includes(SPECIES_QUESTION_FORNAME);
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
                value: dataValue ? new Date(dataValue as string) : new Date(),
            };
            return dateQ;
        }

        case "DATETIME": {
            const dateQ: DateTimeQuestion = {
                ...base,
                type: "datetime",
                value: dataValue
                    ? new Date(dataValue as string).toISOString()
                    : new Date().toISOString(),
            };
            return dateQ;
        }
    }
};

export const mapQuestionsToDataValues = (questions: Question[]): DataValue[] => {
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
                (currentQuestion.id === SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID ||
                    currentQuestion?.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF ||
                    currentQuestion.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL ||
                    currentQuestion.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS ||
                    currentQuestion.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL ||
                    currentQuestion.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF ||
                    currentQuestion.id === AMR_SURVEYS_PREVALENCE_TEA_PATIENT_ID ||
                    currentQuestion.id === AMR_SURVEYS_PREVALENCE_TEA_PATIENT_IDA19)
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
