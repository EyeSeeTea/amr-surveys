import { Id } from "../Ref";
import { Question } from "./QuestionnaireQuestion";
const D2_FUNCTIONS = ["!d2:hasValue", "d2:hasValue", "d2:daysBetween", "d2:yearsBetween"];
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

export const parseCondition = (condition: string, updatedQuestion: Question): boolean => {
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
