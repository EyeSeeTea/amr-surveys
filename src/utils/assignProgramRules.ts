import {
    Question,
    QuestionOption,
    Questionnaire,
    QuestionnaireSection,
} from "../domain/entities/Questionnaire";

const D2_FUNCTIONS = ["d2:hasValue", "d2:daysBetween", "d2:yearsBetween"];
const D2_OPERATORS = [">", ">=", "<", "<=", "==", "!="];

export const assignProgramRules = (
    questionnaire: Questionnaire | undefined,
    updatedQuestion: Question,
    sectionToBeUpdated: QuestionnaireSection
): void => {
    if (questionnaire) {
        const filteredProgramRules = questionnaire.programRules?.filter(
            programRule => programRule.dataElementId === updatedQuestion.id
        );

        filteredProgramRules?.map(rule => {
            rule.programRuleActions.map(action => {
                switch (action.programRuleActionType) {
                    case "HIDEFIELD": {
                        const questionToBeManipulated = sectionToBeUpdated.questions.find(
                            q => q.id === rule?.programRuleActions[0]?.dataElement?.id
                        );

                        if (questionToBeManipulated) {
                            questionToBeManipulated.isVisible = !parseCondition(
                                rule.condition,
                                updatedQuestion
                            );
                        }
                        break;
                    }
                }
            });
        });
    }
};

const parseCondition = (condition: string, updatedQuestion: Question): boolean => {
    const regExLogicOperators = new RegExp("[&|]{2}", "g");

    const conditionArray = condition.split(regExLogicOperators);
    const operatorsOrder = condition.match(regExLogicOperators);

    const values: boolean[] = [];
    conditionArray.map(condition => {
        //If the condition is one of the d2Functions, handle them
        if (D2_FUNCTIONS.filter(d2Function => condition.includes(d2Function)).length !== 0) {
            // "TO DO: handle d2Functions"
            values.push(false);
        } else {
            const operator = D2_OPERATORS.findLast(d2Operator =>
                condition.includes(d2Operator)
            )?.trim();

            if (!operator || !D2_OPERATORS.includes(operator))
                throw new Error(`Operator ${operator} is either undefined or not handled`);

            let leftOperand = isQuestionOptionValue(updatedQuestion.value)
                ? updatedQuestion.value.code
                : updatedQuestion.value;

            let rightOperand: string | boolean = condition
                .substring(condition.indexOf(operator))
                .replace(operator, "")
                .replaceAll("'", "")
                .trim();

            // Handle left operand boolean undefined, which means it's not filled, so false
            // Handle right operands boolean values of "1" and "0" for true and false
            if (typeof updatedQuestion.value === "boolean") {
                leftOperand = leftOperand === undefined ? false : leftOperand;
                rightOperand = rightOperand === "1" ? true : false;
            } else {
                //If not boolean, means the option in the questionnaire is not filled, so condition is always false
                if (leftOperand === undefined) {
                    values.push(false);
                }
            }

            switch (operator) {
                case "!=": {
                    values.push(leftOperand !== rightOperand);
                    break;
                }
                case "==": {
                    values.push(leftOperand === rightOperand);
                    break;
                }
                case ">": {
                    if (leftOperand) values.push(leftOperand > rightOperand);
                    break;
                }
                case ">=": {
                    if (leftOperand) values.push(leftOperand >= rightOperand);
                    break;
                }
                case "<": {
                    if (leftOperand) values.push(leftOperand < rightOperand);
                    break;
                }
                case "<=": {
                    if (leftOperand) values.push(leftOperand <= rightOperand);
                    break;
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

const isQuestionOptionValue = (
    value: string | boolean | QuestionOption | Date | undefined
): value is QuestionOption => {
    return (value as QuestionOption)?.code !== undefined;
};
