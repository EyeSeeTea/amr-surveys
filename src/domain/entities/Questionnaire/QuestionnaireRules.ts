import {
    D2ExpressionParser,
    EvaluatedExpressionResult,
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
    data?: string; // to assign (expression raw value)
    dataEvaluated?: EvaluatedExpressionResult; // to assign (calculated/evaluated value)
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
    condition: string; //dhis2 program rule condition. https://docs.dhis2.org/en/full/develop/dhis-core-version-master/developer-manual.html#webapi_program_rules
    dataElementIds: Id[]; // all dataElements in condition (there could be multiple conditions)
    teAttributeIds: Id[]; // all trackedEntityAttributes in condition (there could be multiple conditions)
    actions: QuestionnaireRuleAction[];
    parsedResult?: boolean; //calculate the condition and store the result
    programRuleVariables: D2ProgramRuleVariable[] | undefined;
}

const rulesByQuestionIdCache = new WeakMap<QuestionnaireRule[], Map<Id, QuestionnaireRule[]>>();

/**
 * Index rules by every question id they read or act on, built once per rules array.
 * Rules keep their original order and appear once per question.
 */
const getRulesByQuestionId = (rules: QuestionnaireRule[]): Map<Id, QuestionnaireRule[]> => {
    const cached = rulesByQuestionIdCache.get(rules);
    if (cached) return cached;

    const index = new Map<Id, QuestionnaireRule[]>();
    rules.forEach(rule => {
        const questionIds = new Set<Id>([...rule.dataElementIds, ...rule.teAttributeIds]);
        rule.actions.forEach(action => {
            if (action.dataElement?.id) questionIds.add(action.dataElement.id);
            if (action.trackedEntityAttribute?.id)
                questionIds.add(action.trackedEntityAttribute.id);
        });
        questionIds.forEach(id => {
            const rulesOfQuestion = index.get(id);
            if (rulesOfQuestion) rulesOfQuestion.push(rule);
            else index.set(id, [rule]);
        });
    });

    rulesByQuestionIdCache.set(rules, index);
    return index;
};

export const getApplicableRules = (
    updatedQuestion: Question,
    questionnaireRules: QuestionnaireRule[],
    questions: Question[]
): QuestionnaireRule[] => {
    //1. Get all Rules that are applicable to the updated question
    const applicableRules = getRulesByQuestionId(questionnaireRules).get(updatedQuestion.id) ?? [];
    if (applicableRules.length === 0) return [];

    //2. Run the rule conditions and return rules with parsed results
    // Also augment rule actions with results of the `data` expression evaluation
    const questionsById = new Map<Id, Question>();
    questions.forEach(question => {
        if (!questionsById.has(question.id)) questionsById.set(question.id, question);
    });
    // Rules usually share the same variables array, so its values are worked out once per call
    const variableValuesCache = new Map<
        D2ProgramRuleVariable[],
        Map<string, ProgramRuleVariableValue>
    >();

    return applicableRules.map(rule => {
        const programRuleVariableValues = getCachedProgramRuleVariableValues(
            rule.programRuleVariables,
            questionsById,
            variableValuesCache
        );
        return {
            ...rule,
            parsedResult: parseConditionWithExpressionParser(rule, programRuleVariableValues),
            actions: getActionsWithEvaluatedDataExpression(rule, programRuleVariableValues),
        };
    });
};

export const getQuestionValueByType = (question: Question): string => {
    switch (question.type) {
        case "select":
            return question.value?.code ?? "";
        case "boolean":
            return question.value === undefined ? "false" : question.value.toString();
        case "date":
            try {
                return question.value?.toISOString().split("T")[0] ?? "";
            } catch (e) {
                return ""; //Handle invalid date
            }
        case "datetime":
            try {
                return question.value?.toString() ?? "";
            } catch (e) {
                return ""; //Handle invalid date
            }
        case "number":
        case "text":
            return question.value ?? "";
        default:
            console.debug("Unknown question type");
            return "";
    }
};

export function getQuestionValueFromEvaluatedExpression(
    question: Question,
    dataEvaluated?: EvaluatedExpressionResult
): Question["value"] {
    // TODO: handle possible mismatches between question value type and dataEvaluated type
    // e.g. question.type is "date" but dataEvaluated is a number
    if (dataEvaluated === null) {
        return undefined;
    } else if (question.type === "select") {
        const option = question.options.find(option => option.code === dataEvaluated);
        if (!option) console.warn("Option not found in question for code:", dataEvaluated);
        return option;
    } else if (typeof dataEvaluated === "number") {
        return dataEvaluated.toString();
    } else {
        return dataEvaluated;
    }
}

function getCachedProgramRuleVariableValues(
    programRuleVariables: Maybe<D2ProgramRuleVariable[]>,
    questionsById: Map<Id, Question>,
    cache: Map<D2ProgramRuleVariable[], Map<string, ProgramRuleVariableValue>>
): Map<string, ProgramRuleVariableValue> {
    if (!programRuleVariables) return new Map();
    const cached = cache.get(programRuleVariables);
    if (cached) return cached;

    const values = getProgramRuleVariableValues(programRuleVariables, questionsById);
    cache.set(programRuleVariables, values);
    return values;
}

function getProgramRuleVariableValues(
    programRuleVariables: D2ProgramRuleVariable[],
    questionsById: Map<Id, Question>
): Map<string, ProgramRuleVariableValue> {
    const programRuleVariableValues: Map<ProgramRuleVariableName, ProgramRuleVariableValue> =
        new Map(
            programRuleVariables.map(prv => {
                const currentQuestion =
                    (prv?.dataElement?.id ? questionsById.get(prv.dataElement.id) : undefined) ??
                    (prv?.trackedEntityAttribute?.id
                        ? questionsById.get(prv.trackedEntityAttribute.id)
                        : undefined);

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

const parseConditionWithExpressionParser = (
    rule: QuestionnaireRule,
    programRuleVariableValues: Map<string, ProgramRuleVariableValue>
): boolean => {
    return new D2ExpressionParser()
        .evaluateRuleEngineCondition(rule.condition, programRuleVariableValues)
        .match({
            success: parsedResult => parsedResult,
            error: errMsg => {
                console.error(errMsg);
                return false;
            },
        });
};

/**
 *  Get the actions from the rule, augmenting them with the `dataEvaluated` property - Only for ASSIGN actions
 *  `dataEvaluated` is set with the results of running the D2ExpressionParser evaluation
 */
const getActionsWithEvaluatedDataExpression = (
    rule: QuestionnaireRule,
    programRuleVariableValues: Map<string, ProgramRuleVariableValue>
): QuestionnaireRuleAction[] => {
    const parser = new D2ExpressionParser();

    return rule.actions.map(action => {
        if (!action.data || action.programRuleActionType !== "ASSIGN") {
            return action;
        }
        return {
            ...action,
            dataEvaluated: parser
                .evaluateActionExpression(action.data, programRuleVariableValues)
                .match({
                    success: evaluationResult => evaluationResult,
                    error: errMsg => {
                        console.error(
                            "Error evaluating ASSIGN data expression",
                            action.data,
                            errMsg
                        );
                        return null;
                    },
                }),
        };
    });
};
