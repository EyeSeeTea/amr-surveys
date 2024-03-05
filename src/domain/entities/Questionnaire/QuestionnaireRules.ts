import { Id } from "../Ref";
import _ from "../generic/Collection";
import { Question } from "./QuestionnaireQuestion";

const D2_FUNCTIONS = ["d2:hasValue", "d2:daysBetween", "d2:yearsBetween"];
const D2_OPERATORS = [
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
        //first check if the dataElementId is in the updatedQuestion,
        if (updatedQuestion.id === dataElementId) {
            return getQuestionValueByType(updatedQuestion);
        } else {
            //if not, check in the questionnaire
            const currentQuestion = questions.find(
                (question: Question) => question.id === dataElementId
            );

            if (currentQuestion) {
                return getQuestionValueByType(currentQuestion);
            } else {
                console.debug(
                    `Cannot find matching question for data element with id : ${dataElementId}  in Questionnaire`
                );
                return "";
            }
        }
    });
};

const handleD2Functions = (condition: string): boolean => {
    const d2Function = D2_FUNCTIONS.find(d2func => condition.includes(d2func));

    switch (d2Function) {
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
        case "d2:daysBetween":
            return false;

        case "d2:yearsBetween":
            return false;

        default:
            console.debug(`Unkown d2 function: ${d2Function}`);
            return false;
    }
};

const handleCondition = (condition: string, updatedQuestion: Question): boolean => {
    const operator = D2_OPERATORS.find(d2Operator => condition.includes(d2Operator));

    if (!operator || !D2_OPERATORS.includes(operator))
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
        updatedQuestion.type === "boolean"
            ? rightOperandStr === "1"
                ? "true"
                : "false"
            : updatedQuestion.type === "select" && leftOperand === "true" && rightOperandStr === "1"
            ? "true"
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
                return leftOperand > rightOperand;
            }
        }
        case ">=": {
            try {
                return parseFloat(leftOperand) >= parseFloat(rightOperand);
            } catch {
                return leftOperand >= rightOperand;
            }
        }
        case "<": {
            try {
                return parseFloat(leftOperand) < parseFloat(rightOperand);
            } catch {
                return leftOperand < rightOperand;
            }
        }
        case "<=": {
            try {
                return parseFloat(leftOperand) <= parseFloat(rightOperand);
            } catch {
                return leftOperand <= rightOperand;
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
    // Create a regular expression from D2_FUNCTIONS array
    const d2FunctionsRegex = new RegExp(`(?<!${D2_FUNCTIONS.join("|")})\\(`);

    // Handle parentheses as long as they are not immediately preceded by a value in D2_FUNCTIONS array
    while (condition.search(d2FunctionsRegex) !== -1) {
        condition = condition.replace(/\(([^()]+)\)/g, (_, subCondition) => {
            return parseCondition(subCondition, updatedQuestion, questions) ? "true" : "false";
        });
    }

    // Split condition into sub-conditions based on logical operators
    const andConditions = condition.split("&&").map(subCondition1 => {
        const orConditions = subCondition1.split("||").map(subCondition2 => {
            const notCondition = subCondition2.trim().startsWith("!");
            if (notCondition) {
                subCondition2 = subCondition2.trim().substring(1);
            }

            // Replace #{dataElementId} with actual value from questionnaire
            const parsedConditionWithValues = parseConditionValues(
                subCondition2,
                updatedQuestion,
                questions
            );

            // Evaluate the condition
            let result: boolean;
            try {
                if (
                    D2_FUNCTIONS.some(d2Function => parsedConditionWithValues.includes(d2Function))
                ) {
                    result = handleD2Functions(parsedConditionWithValues);
                } else {
                    result = handleCondition(parsedConditionWithValues, updatedQuestion);
                }
            } catch (error) {
                console.error(
                    `Error evaluating condition: ${parsedConditionWithValues} with error : ${error}`
                );
                result = false;
            }

            return notCondition ? !result : result;
        });

        // Combine results using OR operator
        return orConditions.includes(true);
    });

    // Combine results using AND operator
    return !andConditions.includes(false);
};
