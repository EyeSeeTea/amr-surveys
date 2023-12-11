import { Maybe, assertUnreachable } from "../../utils/ts-utils";
import { Id, NamedRef, Ref, updateCollection } from "./Ref";
import _ from "../../domain/entities/generic/Collection";

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
}
export interface QuestionnaireSection {
    title: string;
    code: Code;
    questions: Question[];
    isVisible: boolean;
    sortOrder: number;
    stageId: string;
    showAddnew?: boolean;
}

export type Question =
    | SelectQuestion
    | NumberQuestion
    | TextQuestion
    | BooleanQuestion
    | DateQuestion;

export interface QuestionBase {
    id: Id;
    code: Code;
    text: string;
    disabled?: boolean;
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

export interface QuestionOption extends NamedRef {
    code?: string;
}

export type QuestionnaireRule = RuleToggleSectionsVisibility;

interface RuleToggleSectionsVisibility {
    type: "setSectionsVisibility";
    dataElementCode: Code;
    sectionCodes: Code[];
}

export class QuestionnarieM {
    static setAsComplete(questionnarie: Questionnaire, value: boolean): Questionnaire {
        return { ...questionnarie, isCompleted: value };
    }

    static updateQuestion(questionnaire: Questionnaire, questionUpdated: Question): Questionnaire {
        return {
            ...questionnaire,

            stages: questionnaire.stages.map(stage => ({
                ...stage,
                sections: stage.sections.map(section => ({
                    ...section,
                    questions: updateCollection(section.questions, questionUpdated),
                })),
            })),
        };
    }
}

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
