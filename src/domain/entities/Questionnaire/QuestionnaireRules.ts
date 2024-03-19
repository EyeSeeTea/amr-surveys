import { Id } from "../Ref";
import _ from "../generic/Collection";
import { Question } from "./QuestionnaireQuestion";

const RULE_FUNCTIONS = ["d2:hasValue", "d2:daysBetween", "d2:yearsBetween"];
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
    dataElementIds: Id[]; // all dataElements in condition (there could be mutiple conditions)
    actions: QuestionnaireRuleAction[];
    parsedResult?: boolean; //calculate the condition and store the result
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
            rule.actions.some(action => action.dataElement?.id === updatedQuestion.id)
    );

    //2. Run the rule conditions and return rules with parsed results
    const parsedApplicableRules = applicableRules.map(rule => {
        const parsedResult = parseCondition(rule.condition, updatedQuestion, questions);
        return { ...rule, parsedResult };
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
        case "d2:hasValue": {
            const match = condition.match(/d2:hasValue\((.*?)\)/);
            if (match) {
                const innerString = match[1];
                if (innerString?.trim() === "") {
                    console.debug('The string between "d2:hasValue(" and ")" is empty.');
                    return false;
                } else {
                    console.debug(`The string between "d2:hasValue(" and ")" is: ${innerString}`);
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

export const parseCondition = (
    condition: string,
    updatedQuestion: Question,
    questions: Question[]
): boolean => {
    // Create a regular expression from RULE_FUNCTIONS array
    const ruleFunctionsRegex = new RegExp(`(?<!${RULE_FUNCTIONS.join("|")})\\(`);

    // Handle parentheses as long as they are not immediately preceded by a value in RULE_FUNCTIONS array
    while (condition.search(ruleFunctionsRegex) !== -1) {
        condition = condition.replace(
            new RegExp(`(?<!${RULE_FUNCTIONS.join("|")})\\(([^()]+)\\)`, "g"),
            (_, subCondition) => {
                return parseCondition(subCondition, updatedQuestion, questions) ? "true" : "false";
            }
        );
    }

    // Split condition into sub-conditions based on logical operators
    const andConditions = condition.split("&&").map(subCondition1 => {
        const orConditions = subCondition1.split("||").map(subCondition2 => {
            const notCondition = subCondition2.trim().startsWith("!");
            if (notCondition) {
                subCondition2 = subCondition2.trim().substring(1);
            }

            let result: boolean;
            const trimmedSubCondition = subCondition2.replace(/\s/g, "");
            if (trimmedSubCondition === "true") {
                result = true;
            } else if (trimmedSubCondition === "false") {
                result = false;
            } else {
                // Replace #{dataElementId} with actual value from questionnaire
                const parsedConditionWithValues = parseConditionValues(
                    subCondition2,
                    updatedQuestion,
                    questions
                );

                // Evaluate the condition
                try {
                    if (
                        RULE_FUNCTIONS.some(ruleFunction =>
                            parsedConditionWithValues.includes(ruleFunction)
                        )
                    ) {
                        result = handleRuleFunctions(parsedConditionWithValues);
                    } else {
                        result = handleCondition(parsedConditionWithValues);
                    }
                } catch (error) {
                    console.error(
                        `Error evaluating condition: ${parsedConditionWithValues} with error : ${error}`
                    );
                    result = false;
                }
            }
            return notCondition ? !result : result;
        });
        // Combine results using OR operator
        return orConditions.includes(true);
    });
    // Combine results using AND operator
    return !andConditions.includes(false);
};
