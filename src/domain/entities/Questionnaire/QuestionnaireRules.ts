import {
    D2ExpressionParser,
    ProgramRuleVariableName,
    ProgramRuleVariableValue,
} from "../../../data/entities/D2ExpressionParser";
import { D2ProgramRuleVariable } from "../../../data/entities/D2Program";
import { Maybe } from "../../../utils/ts-utils";
import { Id } from "../Ref";
import _ from "../generic/Collection";
import { Question } from "./QuestionnaireQuestion";

export type QuestionnaireRuleActionType =
    | "DISPLAYTEXT"
    | "DISPLAYKEYVALUEPAIR"
    | "HIDEFIELD"
    | "HIDESECTION"
    | "ASSIGN"
    | "SHOWWARNING"
    | "SHOWERROR"
    | "WARNINGONCOMPLETINON"
    | "ERRORONCOMPLETION"
    | "CREATEEVENT"
    | "SETMANDATORYFIELD";

export interface QuestionnaireRuleAction {
    id: Id;
    programRuleActionType: QuestionnaireRuleActionType;
    dataElement?: {
        id: Id | undefined; // to hide
    };
    trackedEntityAttribute?: {
        id: Id | undefined; // to hide
    };
    data?: string; // to assign
    programStageSection?: {
        id: Id | undefined; // to hide/show
    };
    programStage?: {
        id: Id | undefined; // to hide/show
    };
    content?: string; // message content to show
}
export interface QuestionnaireRule {
    id: Id;
    condition: string;
    dataElementIds: Id[]; // all dataElements in condition (there could be mutiple conditions)
    teAttributeIds: Id[]; // all trackedEntityAttributes in condition (there could be mutiple conditions)
    actions: QuestionnaireRuleAction[];
    parsedResult?: boolean; //calculate the condition and store the result
    programRuleVariables: D2ProgramRuleVariable[] | undefined;
}

export const getApplicableRules = (
    updatedQuestion: Question,
    questionnaireRules: QuestionnaireRule[],
    questions: Question[]
): QuestionnaireRule[] => {
    //1. Get all Rules that are applicable to the updated question
    const applicableRules = questionnaireRules.filter(
        rule =>
            rule.dataElementIds.includes(updatedQuestion.id) ||
            rule.teAttributeIds.includes(updatedQuestion.id) ||
            rule.actions.some(action => action.dataElement?.id === updatedQuestion.id) ||
            rule.actions.some(action => action.trackedEntityAttribute?.id === updatedQuestion.id)
    );

    //2. Run the rule conditions and return rules with parsed results
    const parsedApplicableRules = applicableRules.map(rule => {
        const expressionParserResult = parseConditionWithExpressionParser(rule, questions);

        return { ...rule, parsedResult: expressionParserResult };
    });

    return parsedApplicableRules;
};

export const getQuestionValueByType = (question: Question): string => {
    switch (question.type) {
        case "select":
            return question.value?.code ?? "";
        case "boolean":
            return question.value === undefined ? "false" : question.value.toString();
        case "date":
        case "datetime":
            return question.value?.toString() ?? "";

        case "number":
        case "text":
            return question.value ?? "";
        default:
            console.debug("Unknown question type");
            return "";
    }
};

function getProgramRuleVariableValues(
    programRuleVariables: Maybe<D2ProgramRuleVariable[]>,
    questions: Question[]
): Map<string, ProgramRuleVariableValue> {
    const programRuleVariableValues: Map<ProgramRuleVariableName, ProgramRuleVariableValue> =
        new Map(
            programRuleVariables?.map(prv => {
                const currentQuestion = questions.find(
                    question =>
                        question.id === prv?.dataElement?.id ||
                        question.id === prv?.trackedEntityAttribute?.id
                );

                if (!currentQuestion) return [prv.name, { type: "text", value: "" }];
                const value = getQuestionValueByType(currentQuestion);

                return [
                    prv.name,
                    {
                        type:
                            currentQuestion.type === "datetime"
                                ? "date"
                                : currentQuestion.type === "select"
                                ? "text"
                                : currentQuestion.type,
                        value: value,
                    },
                ];
            })
        );

    return programRuleVariableValues;
}

const parseConditionWithExpressionParser = (rule: QuestionnaireRule, questions: Question[]) => {
    try {
        const programRuleVariableValues = getProgramRuleVariableValues(
            rule.programRuleVariables,
            questions
        );

        return new D2ExpressionParser().evaluateRuleEngineCondition(
            rule.condition,
            programRuleVariableValues
        );
    } catch (error) {
        console.error(`Error parsing rule condition: ${rule.condition} with error : ${error}`);
        return false;
    }
};
