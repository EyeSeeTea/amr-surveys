import { Maybe, assertUnreachable } from "../../utils/ts-utils";
import { Id, NamedRef, Ref } from "./Ref";
import _ from "../../domain/entities/generic/Collection";
import { D2ProgramRuleAction } from "../../data/entities/D2Program";

export type Code = string;
export interface QuestionnaireBase {
    id: Id;
    name: string;
    description: string;
    orgUnit: Ref;
    year: string;
    isCompleted: boolean;
    isMandatory: boolean;
}

export interface QuestionnaireSelector {
    id: Id;
    orgUnitId: Id;
    year: string;
}
export interface QuestionnaireRule {
    id: Id;
    condition: string; // eg: "${AMR-Sample 2} != 'NO'"
    dataElementId: Id; // from ProgramRuleVariable
    programRuleActions: D2ProgramRuleAction[];
}

export interface Questionnaire extends QuestionnaireBase {
    stages: QuestionnaireStage[];
    entity?: QuestionnaireEntity; //Equivalant to tracked entity instance of tracker program
    subLevelDetails?: {
        enrollmentId: Id;
    };
    rules: QuestionnaireRule[];
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
        try {
            if (!questionnaire.rules || questionnaire.rules.length === 0) return questionnaire;

            const allQsInQuestionnaire: Question[] = questionnaire.stages.flatMap(stage => {
                return stage.sections.flatMap(section => {
                    return section.questions.map(question => question);
                });
            });

            const updatedQuestionnaire = allQsInQuestionnaire.reduce(
                (questionnaireAcc, question) => {
                    return this.updateQuestion(questionnaireAcc, question);
                },
                questionnaire
            );

            return updatedQuestionnaire;
        } catch (err) {
            //An error occured while parsing rules, return questionnaire as is.
            console.debug(err);
            return questionnaire;
        }
    }

    static updateQuestion(questionnaire: Questionnaire, updatedQuestion: Question): Questionnaire {
        console.debug(`processing question : ${updatedQuestion.id} - ${updatedQuestion.code}`);
        return {
            ...questionnaire,
            stages: questionnaire.stages.map(stage => ({
                ...stage,
                sections: stage.sections.map(section => {
                    return {
                        ...section,
                        questions: section.questions.map(question => {
                            return {
                                ...question,
                                isVisible: isQuestionVisible(
                                    question,
                                    updatedQuestion,
                                    questionnaire.rules
                                ),
                            };
                        }),
                        isVisible: isSectionVisible(section, updatedQuestion, questionnaire.rules),
                    };
                }),
            })),
        };
    }
}

const isQuestionVisible = (
    question: Question,
    updatedQuestion: Question,
    questionnaireRules: QuestionnaireRule[]
): boolean => {
    const applicableRules = questionnaireRules.filter(
        rule =>
            rule.dataElementId === updatedQuestion.id &&
            rule.programRuleActions.filter(
                action =>
                    action.programRuleActionType === "HIDEFIELD" &&
                    action.dataElement &&
                    action.dataElement.id === question.id
            ).length > 0
    );
    if (!applicableRules || applicableRules.length === 0) return question.isVisible;

    const updatedQuestionVisibility = applicableRules.flatMap(rule => {
        return rule.programRuleActions.flatMap(action => {
            if (action.programRuleActionType === "HIDEFIELD") {
                const hideSection = parseCondition(rule.condition, updatedQuestion);
                return !hideSection;
            } else return question.isVisible;
        });
    });
    return updatedQuestionVisibility.every(Boolean);
};

const isSectionVisible = (
    section: QuestionnaireSection,
    updatedQuestion: Question,
    questionnaireRules: QuestionnaireRule[]
): boolean => {
    //Check of there are any rules applicable to the current updated question
    //with hide section action
    const applicableRules = questionnaireRules.filter(
        rule =>
            rule.dataElementId === updatedQuestion.id &&
            rule.programRuleActions.filter(
                action =>
                    action.programRuleActionType === "HIDESECTION" &&
                    action.programStageSection &&
                    action.programStageSection.id === section.code
            ).length > 0
    );
    if (!applicableRules || applicableRules.length === 0) return section.isVisible;

    const updatedSectionVisibility = applicableRules.flatMap(rule => {
        return rule.programRuleActions.flatMap(action => {
            if (action.programRuleActionType === "HIDESECTION") {
                const hideSection = parseCondition(rule.condition, updatedQuestion);
                return !hideSection;
            } else return section.isVisible;
        });
    });
    return updatedSectionVisibility.every(Boolean);
};

const parseCondition = (condition: string, updatedQuestion: Question): boolean => {
    const regExLogicOperators = new RegExp("[&|]{2}", "g");

    const conditionArray = condition.split(regExLogicOperators);
    const operatorsOrder = condition.match(regExLogicOperators);

    const values: boolean[] = conditionArray.map(condition => {
        //TO DO : If the condition is one of the d2Functions, handle them
        if (D2_FUNCTIONS.some(d2Function => condition.includes(d2Function))) {
            return false;
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

            switch (operator) {
                case "!=": {
                    return leftOperand !== rightOperand;
                }
                case "==": {
                    return leftOperand === rightOperand;
                }
                case ">": {
                    if (leftOperand) return leftOperand > rightOperand;
                    else return false;
                }
                case ">=": {
                    if (leftOperand) return leftOperand >= rightOperand;
                    else return false;
                }
                case "<": {
                    if (leftOperand) return leftOperand < rightOperand;
                    else return false;
                }
                case "<=": {
                    if (leftOperand) return leftOperand <= rightOperand;
                    else return false;
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
