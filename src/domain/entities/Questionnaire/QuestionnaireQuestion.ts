import { Maybe, assertUnreachable } from "../../../utils/ts-utils";
import { Id, NamedRef } from "../Ref";
import { QuestionnaireRule } from "./QuestionnaireRules";
import _ from "../generic/Collection";
import { Questionnaire, QuestionnarieM } from "./Questionnaire";

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
    errors: string[];
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

    static updateQuestions(
        questions: Question[],
        updatedQuestion: Question,
        rules: QuestionnaireRule[],
        questionnaire: Questionnaire
    ): Question[] {
        //1. Update the question value.
        const updatedQuestionValue = questions.map(question => {
            if (question.id === updatedQuestion.id) return updatedQuestion;
            else return question;
        });

        //2. Now, apply all possible side effects of the updated value to the rest of the questionnaire.
        //Get all the questions that require update
        const allQuestionsRequiringUpdate = _(
            rules.flatMap(rule => {
                const actionUpdates = rule.actions.flatMap(action => action?.dataElement?.id);
                const dataElementUpdates = rule.dataElementIds;
                return [...actionUpdates, ...dataElementUpdates];
            })
        )
            .compact()
            .uniq()
            .value();

        const updatedQuestions = updatedQuestionValue.map(question => {
            const rulesForCurrentQuestion = QuestionnarieM.getApplicableRules(
                question,
                questionnaire.rules,
                questions
            );

            //If the question is part of any of the rule actions, update the section
            const updatedParsedQuestion =
                allQuestionsRequiringUpdate.includes(question.id) ||
                question.id === updatedQuestion.id
                    ? this.updateQuestion(question, rulesForCurrentQuestion)
                    : question;

            return updatedParsedQuestion;
        });

        return updatedQuestions;
    }

    static updateQuestion(question: Question, rules: QuestionnaireRule[]): Question {
        const updatedIsVisible = this.isQuestionVisible(question, rules);
        const updatedErrorsByDataElement = this.getQuestionWarningsAndErrors(rules);

        const updatedErrors = _(
            updatedErrorsByDataElement
                .filter(err => err.dataElementId === question.id)
                .map(error => error.errorMsg)
        )
            .compact()
            .value();

        return {
            ...question,
            isVisible: updatedIsVisible,
            errors: updatedErrors,
        };
    }

    static isQuestionVisible(question: Question, rules: QuestionnaireRule[]): boolean {
        //Check of there are any rules applicable to the current question
        //with hide field action
        const applicableRules = rules.filter(
            rule =>
                rule.actions.filter(
                    action =>
                        action.programRuleActionType === "HIDEFIELD" &&
                        action.dataElement &&
                        action.dataElement.id === question.id
                ).length > 0
        );
        if (!applicableRules || applicableRules.length === 0) return question.isVisible;

        const updatedQuestionVisibility = applicableRules.flatMap(rule => {
            return rule.actions.flatMap(action => {
                if (action.programRuleActionType === "HIDEFIELD") {
                    if (rule.parsedResult === true) return false;
                    else return;
                } else return question.isVisible;
            });
        });

        //If even one of the rules asks to hide the field, hide the question
        return updatedQuestionVisibility.some(visibility => visibility === false) ? false : true;
    }

    static getQuestionWarningsAndErrors(rules: QuestionnaireRule[]): {
        errorMsg: string | undefined;
        dataElementId: string | undefined;
    }[] {
        const updatedQuestionErrors = rules.flatMap(rule => {
            return rule.actions.flatMap(action => {
                if (
                    action.programRuleActionType === "SHOWWARNING" ||
                    action.programRuleActionType === "SHOWERROR"
                ) {
                    if (rule.parsedResult === true)
                        return { errorMsg: action.content, dataElementId: action.dataElement?.id };
                    else return;
                }
            });
        });

        return _(updatedQuestionErrors).compact().value();
    }
}

function isInteger(s: string): boolean {
    return Boolean(s.match(/^-?\d*$/));
}
