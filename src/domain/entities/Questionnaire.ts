import { Maybe, assertUnreachable } from "../../utils/ts-utils";
import { Id, NamedRef, Ref } from "./Ref";
import _ from "../../domain/entities/generic/Collection";
import { ProgramRule } from "./Program";

export type Code = string;
export interface QuestionnaireBase {
    id: Id;
    name: string;
    description: string;
    orgUnit: Ref;
    year: string;
    isCompleted: boolean;
    isMandatory: boolean;
    rules: QuestionnaireRule[];
}

export interface QuestionnaireSelector {
    id: Id;
    orgUnitId: Id;
    year: string;
}

export interface Questionnaire extends QuestionnaireBase {
    stages: QuestionnaireStage[];
    entity?: QuestionnaireEntity; //Equivalant to tracked entity instance of tracker program
    subLevelDetails?: {
        enrollmentId: Id;
    };
    programRules?: ProgramRule[];
}

export interface QuestionnaireEntity {
    title: string;
    code: string;
    questions: Question[];
    isVisible: boolean;
    stageId: string;
}
export interface QuestionnaireStage {
    title: string;
    code: Code;
    sections: QuestionnaireSection[];
    isVisible: boolean;
    showNextStage?: boolean;
    instanceId?: Id; //Corresponds to DHIS eventId
}
export interface QuestionnaireSection {
    title: string;
    code: Code;
    questions: Question[];
    isVisible: boolean;
    sortOrder: number;
    stageId: string;
    showAddnew?: boolean;
    showAddQuestion?: Id;
}

export type Question =
    | SelectQuestion
    | NumberQuestion
    | TextQuestion
    | BooleanQuestion
    | DateQuestion
    | DateTimeQuestion;

export interface QuestionBase {
    id: Id;
    code: Code;
    text: string;
    disabled?: boolean;
    isVisible: boolean;
    sortOrder: number | undefined;
}

export interface SelectQuestion extends QuestionBase {
    type: "select";
    options: QuestionOption[];
    value: Maybe<QuestionOption>;
}

export interface NumberQuestion extends QuestionBase {
    type: "number";
    numberType:
        | "NUMBER"
        | "INTEGER_ZERO_OR_POSITIVE"
        | "INTEGER"
        | "INTEGER_NEGATIVE"
        | "INTEGER_POSITIVE"
        | "INTEGER_ZERO_OR_POSITIVE";
    value: Maybe<string>; // Use string representation to avoid problems with rounding
}

export interface TextQuestion extends QuestionBase {
    type: "text";
    value: Maybe<string>;
    multiline: boolean;
}

export interface BooleanQuestion extends QuestionBase {
    type: "boolean";
    storeFalse: boolean;
    value: Maybe<boolean>;
}

export interface DateQuestion extends QuestionBase {
    type: "date";
    value: Maybe<Date>;
}

export interface DateTimeQuestion extends QuestionBase {
    type: "datetime";
    value: Maybe<string>;
}

export interface QuestionOption extends NamedRef {
    code?: string;
}

export type QuestionnaireRule = RuleToggleSectionsVisibility;

interface RuleToggleSectionsVisibility {
    type: "setSectionsVisibility";
    dataElementCode: Code;
    sectionCodes: Code[];
}

const D2_FUNCTIONS = ["!d2:hasValue", "d2:hasValue", "d2:daysBetween", "d2:yearsBetween"];
const D2_OPERATORS = [
    ">" as const,
    ">=" as const,
    "<" as const,
    "<=" as const,
    "==" as const,
    "!=" as const,
];

export class QuestionnarieM {
    static setAsComplete(questionnarie: Questionnaire, value: boolean): Questionnaire {
        return { ...questionnarie, isCompleted: value };
    }

    static applyAllRulesOnQuestionnaireInitialLoad(questionnaire: Questionnaire): Questionnaire {
        if (!questionnaire.programRules || questionnaire.programRules.length === 0)
            return questionnaire;

        questionnaire.stages.forEach(stage => {
            return stage.sections.forEach(section => {
                return section.questions.forEach(question => {
                    questionnaire = this.updateQuestion(questionnaire, question);
                });
            });
        });

        return questionnaire;
    }

    static updateQuestion(questionnaire: Questionnaire, questionUpdated: Question): Questionnaire {
        return {
            ...questionnaire,

            stages: questionnaire.stages.map(stage => ({
                ...stage,
                sections: stage.sections.map(section => {
                    const isSectionVisible = applyRulesAndUpdateEffectedSection(
                        section,
                        questionUpdated,
                        questionnaire.programRules
                    ).isVisible;
                    return {
                        ...section,
                        questions: updateQuestionAndApplyRules(
                            section.questions,
                            questionUpdated,
                            questionnaire.programRules
                        ),
                        isVisible: isSectionVisible,
                    };
                }),
            })),
        };
    }
}

// function questionRuleReducer(
//     questions: Question[],
//     programRules: ProgramRule[] | undefined
// ): Question[] {
//     const allUpdatedQuestions = questions.map((question, index, updatedArray) => {
//         const intermediateUpdates = applyRulesAndUpdatedEffectedQuestions(
//             updatedArray,
//             question,
//             programRules
//         );

//         if (index === questions.length - 1) {
//             return intermediateUpdates;
//         } else return undefined;
//     });

//     const uniqueUpdateQuestions = _(allUpdatedQuestions).compact().flatten().value();

//     return uniqueUpdateQuestions;
// }

function updateQuestionAndApplyRules(
    questions: Question[],
    updatedQuestion: Question,
    programRules: ProgramRule[] | undefined
) {
    const updatedSectionQuestions = questions.map(question => {
        if (question.id === updatedQuestion.id) {
            return updatedQuestion;
        } else return question;
    });

    if (programRules && programRules.length > 0)
        return applyRulesAndUpdatedEffectedQuestions(
            updatedSectionQuestions,
            updatedQuestion,
            programRules
        );
    return updatedSectionQuestions;
}

function applyRulesAndUpdatedEffectedQuestions(
    questions: Question[],
    updatedQuestion: Question,
    programRules: ProgramRule[] | undefined
): Question[] {
    if (questions.some(question => question.id === updatedQuestion.id)) {
        const filteredProgramRules = programRules?.filter(
            programRule => programRule.dataElementId === updatedQuestion.id
        );

        if (!filteredProgramRules || filteredProgramRules.length === 0) return questions;

        filteredProgramRules.map(rule => {
            rule.programRuleActions.map(action => {
                switch (action.programRuleActionType) {
                    case "HIDEFIELD":
                        {
                            const questionToBeManipulated = questions.find(
                                q => q.id === action.dataElement?.id
                            );
                            //TO DO : do not update in place. Problem is the order needs to be maintained.
                            if (questionToBeManipulated) {
                                const isVisible = !parseCondition(rule.condition, updatedQuestion);
                                questionToBeManipulated.isVisible = isVisible;
                            }
                        }
                        break;
                }
            });
        });

        return questions;
    } else {
        return questions;
    }
}

function applyRulesAndUpdateEffectedSection(
    section: QuestionnaireSection,
    updatedQuestion: Question,
    programRules: ProgramRule[] | undefined
): QuestionnaireSection {
    const filteredProgramRules = programRules?.filter(
        programRule => programRule.dataElementId === updatedQuestion.id
    );

    if (!filteredProgramRules || filteredProgramRules.length === 0) return section;

    filteredProgramRules.map(rule => {
        rule.programRuleActions.map(action => {
            switch (action.programRuleActionType) {
                case "HIDESECTION": {
                    //TO DO : do not update in place. Problem is the order needs to be maintained.
                    if (section.code === action.programStageSection?.id)
                        section.isVisible = !parseCondition(rule.condition, updatedQuestion);

                    break;
                }
            }
        });
    });
    return section;
}

const parseCondition = (condition: string, updatedQuestion: Question): boolean => {
    const regExLogicOperators = new RegExp("[&|]{2}", "g");

    const conditionArray = condition.split(regExLogicOperators);
    const operatorsOrder = condition.match(regExLogicOperators);

    const values: boolean[] = [];
    conditionArray.map(condition => {
        //If the condition is one of the d2Functions, handle them
        if (D2_FUNCTIONS.some(d2Function => condition.includes(d2Function))) {
            switch (true) {
                case condition.includes("!d2:hasValue"): {
                    const leftOperand =
                        updatedQuestion.type === "select"
                            ? updatedQuestion.value?.code
                            : updatedQuestion.value;
                    if (
                        leftOperand === undefined ||
                        (updatedQuestion.type === "select" && leftOperand === "")
                    ) {
                        console.debug(true);
                        values.push(true);
                    }

                    break;
                }

                case condition.includes("d2:hasValue"): {
                    const leftOperand =
                        updatedQuestion.type === "select"
                            ? updatedQuestion.value?.code
                            : updatedQuestion.value;
                    if (
                        leftOperand !== undefined ||
                        (updatedQuestion.type === "select" && leftOperand !== "")
                    ) {
                        console.debug(true);
                        values.push(true);
                    }

                    break;
                }

                case condition.includes("d2:daysBetween"): {
                    // "TO DO: handle
                    values.push(false);
                    break;
                }

                case condition.includes("d2:yearsBetween"): {
                    // "TO DO: handle
                    values.push(false);
                    break;
                }
            }
        } else {
            const operatorArr = D2_OPERATORS.filter(d2Operator => condition.includes(d2Operator));

            const operator = operatorArr.at(operatorArr.length - 1);

            if (!operator || !D2_OPERATORS.includes(operator))
                throw new Error(`Operator ${operator} is either undefined or not handled`);

            const leftOperand =
                updatedQuestion.type === "select"
                    ? updatedQuestion.value?.code
                    : updatedQuestion.type === "boolean"
                    ? // Handle left operand boolean undefined, which means it's not filled, so false
                      updatedQuestion.value === undefined
                        ? false
                        : updatedQuestion.value
                    : updatedQuestion.value;

            const rightOperandStr = condition
                .substring(condition.indexOf(operator))
                .replace(operator, "")
                .replaceAll("'", "")
                .trim();

            // Handle right operands boolean values of "1" and "0" for true and false
            const rightOperand: string | boolean =
                updatedQuestion.type === "boolean"
                    ? rightOperandStr === "1"
                        ? true
                        : false
                    : rightOperandStr;

            if (updatedQuestion.type !== "boolean") {
                //If not boolean, means the option in the questionnaire is not filled, so condition is always false
                if (leftOperand === undefined) {
                    values.push(false);
                }
            }

            switch (operator) {
                case "!=": {
                    values.push(leftOperand !== rightOperand);
                    break;
                }
                case "==": {
                    values.push(leftOperand === rightOperand);
                    break;
                }
                case ">": {
                    if (leftOperand) values.push(leftOperand > rightOperand);
                    break;
                }
                case ">=": {
                    if (leftOperand) values.push(leftOperand >= rightOperand);
                    break;
                }
                case "<": {
                    if (leftOperand) values.push(leftOperand < rightOperand);
                    break;
                }
                case "<=": {
                    if (leftOperand) values.push(leftOperand <= rightOperand);
                    break;
                }
                default:
                    throw new Error(`Operator ${operator} not handled`);
            }
        }
    });

    //TO DO: handle multiple operations
    const result: boolean | undefined =
        operatorsOrder?.[0] === "&&" ? values.every(Boolean) : values.some(Boolean);

    if (result !== undefined) {
        return result;
    } else {
        throw new Error("Program Rule could not be evaluated");
    }
};

// const isQuestionOptionValue = (
//     value: string | boolean | QuestionOption | Date | undefined
// ): value is QuestionOption => {
//     return (value as QuestionOption)?.code !== undefined;
// };

export class QuestionnaireQuestionM {
    static isValidNumberValue(s: string, numberType: NumberQuestion["numberType"]): boolean {
        if (!s) return true;

        switch (numberType) {
            case "INTEGER":
                return isInteger(s);
            case "NUMBER":
                return true;
            case "INTEGER_ZERO_OR_POSITIVE":
                return isInteger(s) && parseInt(s) >= 0;
            case "INTEGER_NEGATIVE":
                return isInteger(s) && parseInt(s) < 0;
            case "INTEGER_POSITIVE":
                return isInteger(s) && parseInt(s) > 0;
            default: {
                assertUnreachable(numberType);
                return false;
            }
        }
    }

    static update<Q extends Question>(question: Q, value: Q["value"]): Q {
        return { ...question, value };
    }
}

function isInteger(s: string): boolean {
    return Boolean(s.match(/^-?\d*$/));
}
