import { useCallback } from "react";
import {
    ASTResultsQuestion,
    AntibioticQuestion,
    AntibioticValueQuestion,
    Question,
    isASTResultsQuestion,
    isAntibioticValueQuestion,
} from "../../../../domain/entities/Questionnaire/QuestionnaireQuestion";

interface GridRowQuestions {
    option: string;
    antibiotic: AntibioticQuestion;
    astResults: ASTResultsQuestion;
    valueQuestion: AntibioticValueQuestion;
    updateQuestion: (question: Question) => void;
}

/**
 * Saves a result or value of the row, together with the row's antibiotic in the same slot. When both the
 * result and the value are cleared, the antibiotic is cleared too, so the slot is free for another drug.
 */
export const useGridRow = ({
    option,
    antibiotic,
    astResults,
    valueQuestion,
    updateQuestion,
}: GridRowQuestions) => {
    const updateGridRow = useCallback(
        (question: Question) => {
            updateQuestion(question);

            // A loaded empty drop-down holds an empty option, so a result counts only when it has a code.
            const result = isASTResultsQuestion(question) ? question.value : astResults.value;
            const value = isAntibioticValueQuestion(question)
                ? question.value
                : valueQuestion.value;
            const hasResultOrValue = Boolean(result?.code || value);
            const updatedAntibiotic: AntibioticQuestion = {
                ...antibiotic,
                value: hasResultOrValue
                    ? antibiotic.options.find(op => op.name === option)
                    : undefined,
            };
            updateQuestion(updatedAntibiotic);
        },
        [antibiotic, astResults.value, option, updateQuestion, valueQuestion.value]
    );

    return { updateGridRow };
};
