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
            switch (rule?.programRuleActions[0]?.programRuleActionType) {
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
    }
};

const parseCondition = (condition: string, updatedQuestion: Question): boolean => {
    const regExLogicOperators = new RegExp("[&|]{2}", "g");

    const conditionArray = condition.split(regExLogicOperators);

    let value: boolean | undefined;
    conditionArray.forEach(condition => {
        //If the condition is one of the d2Functions, handle them
        if (D2_FUNCTIONS.filter(d2Function => condition.includes(d2Function)).length !== 0) {
            // "TO DO: handle d2Functions"
        } else {
            const operator = D2_OPERATORS.findLast(d2Operator =>
                condition.includes(d2Operator)
            )?.trim();
            if (!operator) throw new Error("Condition is wrongly built");

            const leftOperand = isQuestionOptionValue(updatedQuestion.value)
                ? updatedQuestion.value.code
                : updatedQuestion.value;

            if (leftOperand === undefined) throw new Error("Left operand is undefined");

            let rightOperand: string | boolean = condition
                .substring(condition.indexOf(operator))
                .replace(operator, "")
                .replaceAll("'", "")
                .trim();

            if (typeof updatedQuestion.value === "boolean") {
                rightOperand = rightOperand === "1" ? true : false;
            }
            switch (operator) {
                case "!=": {
                    value = leftOperand !== rightOperand;
                    break;
                }
                case "==": {
                    value = leftOperand === rightOperand;
                    break;
                }
                case ">": {
                    value = leftOperand > rightOperand;
                    break;
                }
                case ">=": {
                    value = leftOperand >= rightOperand;
                    break;
                }
                case "<": {
                    value = leftOperand < rightOperand;
                    break;
                }
                case "<=": {
                    value = leftOperand <= rightOperand;
                    break;
                }
                default:
                    throw new Error(`Operator ${operator} not handled`);
            }
        }
    });

    if (value !== undefined) {
        return value;
    } else {
        throw new Error("Error defining the conditions");
    }
};

const isQuestionOptionValue = (
    value: string | boolean | QuestionOption | Date | undefined
): value is QuestionOption => {
    return (value as QuestionOption).code !== undefined;
};
