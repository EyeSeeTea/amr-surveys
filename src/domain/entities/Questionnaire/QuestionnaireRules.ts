import { D2ProgramRuleVariable } from "../../../data/entities/D2Program";
import { Id } from "../Ref";
import _ from "../generic/Collection";
import { Question } from "./QuestionnaireQuestion";

import * as xp from "@dhis2/expression-parser";

const RULE_FUNCTIONS = ["fn:hasValue", "fn:daysBetween", "fn:yearsBetween"];
const RULE_OPERATORS = [
    ">" as const,
    ">=" as const,
    "<" as const,
    "<=" as const,
    "==" as const,
    "!=" as const,
];

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
    condition: string; //condition is parsed with dataelementId e.g: #{dataElementId} == 'Yes'
    d2Condition: string; //SNEHA TO DO : remove above condition and use this condition after testing
    originalCondition: string;
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
        const customParserResult = parseCondition(rule.condition, updatedQuestion, questions);

        const expressionParserResult = parseConditionWithExpressionParser(rule, questions);

        //SNEHA DEBUG
        if (customParserResult !== expressionParserResult) {
            console.debug(
                `custom parser and expression parser give diffrent results for rule : ${
                    rule.id
                }, condition : ${
                    rule.originalCondition
                }, custom parser : ${expressionParserResult}, expression parser : ${customParserResult}, value: ${
                    questions.find(q => q.id === rule.dataElementIds[0])?.value
                }`
            );
        }

        return { ...rule, parsedResult: expressionParserResult };
    });

    return parsedApplicableRules;
};

const getQuestionValueByType = (question: Question): string => {
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

const parseConditionValues = (
    condition: string,
    updatedQuestion: Question,
    questions: Question[]
) => {
    return condition.replace(/#\{(.*?)\}/g, (_i, dataElementId) => {
        const isDataElementInUpdatedQuestion = updatedQuestion.id === dataElementId;
        if (isDataElementInUpdatedQuestion) {
            return getQuestionValueByType(updatedQuestion);
        } else {
            const currentQuestion = questions.find(
                (question: Question) => question.id === dataElementId
            );
            return currentQuestion ? getQuestionValueByType(currentQuestion) : "";
        }
    });
};

const handleRuleFunctions = (condition: string): boolean => {
    const ruleFunction = RULE_FUNCTIONS.find(rulefunc => condition.includes(rulefunc));

    switch (ruleFunction) {
        case "fn:hasValue": {
            const match = condition.match(/fn:hasValue\((.*?)\)/);
            if (match) {
                const innerString = match[1];
                if (innerString?.trim() === "") {
                    return false;
                } else {
                    return true;
                }
            } else return false;
        }

        default:
            console.debug(`Unkown rule function: ${ruleFunction}`);
            return false;
    }
};

const handleCondition = (condition: string): boolean => {
    const operator = RULE_OPERATORS.find(ruleOperator => condition.includes(ruleOperator));

    if (!operator || !RULE_OPERATORS.includes(operator))
        throw new Error(`Operator ${operator} is either undefined or not handled`);

    const leftOperand = condition
        .substring(0, condition.indexOf(operator))
        .replaceAll("'", "")
        .trim();

    const rightOperandStr = condition
        .substring(condition.indexOf(operator))
        .replace(operator, "")
        .replaceAll("'", "")
        .trim();

    // Handle right operands boolean values of "1" and "0" for true and false
    const rightOperand =
        leftOperand === "true" && rightOperandStr === "1"
            ? "true"
            : leftOperand === "false" && rightOperandStr === "0"
            ? "false"
            : rightOperandStr;

    switch (operator) {
        case "!=": {
            return leftOperand !== rightOperand;
        }
        case "==": {
            return leftOperand === rightOperand;
        }
        case ">": {
            try {
                return parseFloat(leftOperand) > parseFloat(rightOperand);
            } catch {
                return false;
            }
        }
        case ">=": {
            try {
                return parseFloat(leftOperand) >= parseFloat(rightOperand);
            } catch {
                return false;
            }
        }
        case "<": {
            try {
                return parseFloat(leftOperand) < parseFloat(rightOperand);
            } catch {
                return false;
            }
        }
        case "<=": {
            try {
                return parseFloat(leftOperand) <= parseFloat(rightOperand);
            } catch {
                return false;
            }
        }
        default:
            throw new Error(`Operator ${operator} not handled`);
    }
};

const parseAndEvaluateSubCondition = (
    subCondition: string,
    updatedQuestion: Question,
    questions: Question[]
): boolean => {
    // Replace #{dataElementId} with actual value from questionnaire
    const parsedConditionWithValues = parseConditionValues(
        subCondition,
        updatedQuestion,
        questions
    );

    // Evaluate the condition
    try {
        if (RULE_FUNCTIONS.some(ruleFunction => parsedConditionWithValues.includes(ruleFunction))) {
            return handleRuleFunctions(parsedConditionWithValues);
        } else {
            return handleCondition(parsedConditionWithValues);
        }
    } catch (error) {
        console.error(
            `Error evaluating condition: ${parsedConditionWithValues} with error : ${error}`
        );
        return false;
    }
};

const parseCondition = (
    condition: string,
    updatedQuestion: Question,
    questions: Question[]
): boolean => {
    // Create a regular expression from RULE_FUNCTIONS array
    const ruleFunctionsRegex = new RegExp(`(?<!${RULE_FUNCTIONS.join("|")})\\(`);

    // Handle parentheses as long as they are not immediately preceded by a value in RULE_FUNCTIONS array
    const newCondition =
        condition.search(ruleFunctionsRegex) !== -1
            ? condition.replace(
                  new RegExp(`(?<!${RULE_FUNCTIONS.join("|")})\\(([^()]+)\\)`, "g"),
                  (_, subCondition) => {
                      return parseCondition(subCondition, updatedQuestion, questions)
                          ? "true"
                          : "false";
                  }
              )
            : condition;

    // Split condition into sub-conditions based on logical operators
    const andConditions = newCondition.split("&&").map(subCondition1 => {
        const orConditions = subCondition1.split("||").map(subCondition2 => {
            const notCondition = subCondition2.trim().replace("(", "").startsWith("!");
            const trimmedSubCondition = notCondition
                ? subCondition2.trim().substring(1)
                : subCondition2;

            const result =
                trimmedSubCondition.replace(/\s/g, "") === "true"
                    ? true
                    : trimmedSubCondition.replace(/\s/g, "") === "false"
                    ? false
                    : parseAndEvaluateSubCondition(trimmedSubCondition, updatedQuestion, questions);

            return notCondition ? !result : result;
        });

        return orConditions.some(condition => condition);
    });

    return andConditions.every(condition => condition);
};

const parseConditionWithExpressionParser = (rule: QuestionnaireRule, questions: Question[]) => {
    try {
        const dataItemsExpressionParser = new xp.ExpressionJs(
            rule.d2Condition,
            xp.ExpressionMode.RULE_ENGINE_CONDITION
        );

        const dataItems = dataItemsExpressionParser.collectDataItems();
        const dataItemValueMap = dataItems.map((dataItem: xp.DataItemJs) => {
            const currentQuestion = questions.find(question => question.id === dataItem.uid0.value);
            if (!currentQuestion) return { dataItem: dataItem, value: "" };

            const value = getQuestionValueByType(currentQuestion);
            return {
                dataItem: dataItem,
                value: value,
            };
        });
        const dataItemsMap = new Map(dataItemValueMap.map(a => [a.dataItem, a.value]));

        const programRuleVariableExpressionParser = new xp.ExpressionJs(
            rule.originalCondition,
            xp.ExpressionMode.RULE_ENGINE_CONDITION
        );

        const programRuleVariables =
            programRuleVariableExpressionParser.collectProgramRuleVariableNames();
        const programRuleVariablesValueMap = programRuleVariables.map(programRuleVariable => {
            const currentProgramRuleVariable = rule.programRuleVariables?.find(
                prv => prv.name === programRuleVariable
            );
            const currentQuestion = questions.find(
                question =>
                    question.id === currentProgramRuleVariable?.dataElement?.id ||
                    question.id === currentProgramRuleVariable?.trackedEntityAttribute?.id
            );

            if (!currentQuestion)
                return {
                    programRuleVariable: programRuleVariable,
                    value: new xp.VariableValueJs(xp.ValueType.STRING, null, [], null),
                };
            const value = getQuestionValueByType(currentQuestion);
            //SNEHA DEBUG : This is my guess.
            // const candidates = currentQuestion.type === "select" ? currentQuestion.options : [];
            // const eventDate = new Date();

            const variableValue = getVariableValueByType(
                currentQuestion,
                value === "" ? null : value
            );

            return {
                programRuleVariable: programRuleVariable,
                value: variableValue,
            };
        });
        const programRuleVariablesMap = new Map(
            programRuleVariablesValueMap.map(a => [a.programRuleVariable, a.value])
        );

        const expressionData = new xp.ExpressionDataJs(
            programRuleVariablesMap,
            undefined,
            undefined,
            dataItemsMap,
            undefined
        );
        const parsedResult: boolean = programRuleVariableExpressionParser.evaluate(
            a => console.debug("ABC" + a), //SNEGHA DEBUG : what is this?
            expressionData
        );
        return parsedResult;
    } catch (error) {
        console.error(`Error parsing rule condition: ${rule.condition} with error : ${error}`);
        return false;
    }
};

const getVariableValueByType = (
    question: Question,
    stringValue: xp.Nullable<string>
): xp.VariableValueJs => {
    switch (question.type) {
        case "select":
        case "text":
            return new xp.VariableValueJs(xp.ValueType.STRING, stringValue, [], null);
        case "boolean":
            return new xp.VariableValueJs(xp.ValueType.BOOLEAN, stringValue, [], null);
        case "date":
        case "datetime":
            return new xp.VariableValueJs(xp.ValueType.DATE, stringValue, [], null);

        case "number":
            return new xp.VariableValueJs(xp.ValueType.NUMBER, stringValue, [], null);
    }
};
