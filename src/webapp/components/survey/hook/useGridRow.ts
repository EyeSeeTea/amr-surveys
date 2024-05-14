import { useCallback } from "react";
import {
    AntibioticQuestion,
    BooleanQuestion,
    Question,
    isASTResultsQuestion,
    isAntibioticValueQuestion,
} from "../../../../domain/entities/Questionnaire/QuestionnaireQuestion";

export const useGridRow = (
    updateAstResults: (question: Question) => void,
    updateValue: (question: Question) => void,
    antibiotic: AntibioticQuestion,
    option: string,
    updateAntibitoticQuestion: (question: Question) => void,
    addNewAntibioticQuestion: BooleanQuestion,
    updateAddNewAntibiotic: (question: Question) => void
) => {
    const updateGridRow = useCallback(
        (question: Question) => {
            if (isASTResultsQuestion(question)) {
                updateAstResults(question);
            } else if (isAntibioticValueQuestion(question)) {
                updateValue(question);
            }
            const updatedAntibiotic: AntibioticQuestion = {
                ...antibiotic,
                value: antibiotic.options.find(op => op.name === option),
            };

            updateAntibitoticQuestion(updatedAntibiotic);

            const newAddNewAntibiotic: BooleanQuestion = {
                ...addNewAntibioticQuestion,
                value: true,
            };

            updateAddNewAntibiotic(newAddNewAntibiotic);
        },
        [
            addNewAntibioticQuestion,
            antibiotic,
            option,
            updateAddNewAntibiotic,
            updateAntibitoticQuestion,
            updateAstResults,
            updateValue,
        ]
    );

    return { updateGridRow };
};
