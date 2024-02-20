import { Maybe, assertUnreachable } from "../../../utils/ts-utils";
import { Id, NamedRef } from "../Ref";
import { QuestionnaireRule, parseCondition } from "./QuestionnaireRules";

export type Code = string;
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

export class QuestionnaireQuestion {
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

    static updateQuestion(
        question: Question,
        updatedQuestion: Question,
        questionnaireRules: QuestionnaireRule[]
    ): Question {
        const updatedIsVisible = this.isQuestionVisible(
            question,
            updatedQuestion,
            questionnaireRules
        );

        if (question.id === updatedQuestion.id)
            return {
                ...updatedQuestion,
                isVisible: updatedIsVisible,
            };
        else
            return {
                ...question,
                isVisible: updatedIsVisible,
            };
    }

    static isQuestionVisible(
        question: Question,
        updatedQuestion: Question,
        questionnaireRules: QuestionnaireRule[]
    ): boolean {
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
    }
}

function isInteger(s: string): boolean {
    return Boolean(s.match(/^-?\d*$/));
}
