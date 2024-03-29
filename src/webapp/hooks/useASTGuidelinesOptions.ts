import { useEffect, useState } from "react";
import { useASTGuidelinesContext } from "../contexts/ast-guidelines-context";
import { useCurrentSurveys } from "../contexts/current-surveys-context";
import { SpeciesQuestion } from "../../domain/entities/Questionnaire/QuestionnaireQuestion";

export function useASTGuidelinesOptions() {
    const astGuidelines = useASTGuidelinesContext();
    const { currentPrevalenceSurveyForm } = useCurrentSurveys();

    const [currentASTMatrix, setCurrentASTMatrix] = useState<Map<string, string[]>>(new Map());
    const [currentASTList, setCurrentASTList] = useState<Map<string, string[]>>(new Map());

    useEffect(() => {
        const currentList =
            currentPrevalenceSurveyForm?.astGuidelines === "CLSI"
                ? astGuidelines.CLSI_lists
                : astGuidelines.EUCAST_lists;
        setCurrentASTList(currentList);

        const currentMatrix =
            currentPrevalenceSurveyForm?.astGuidelines === "CLSI"
                ? astGuidelines.CLSI_matrix
                : astGuidelines.EUCAST_matrix;
        setCurrentASTMatrix(currentMatrix);
    }, [astGuidelines, currentPrevalenceSurveyForm]);

    const getAntibioticOptions = (question: SpeciesQuestion): string[] | undefined => {
        const matrixKey = [...currentASTList].find(
            keyVal => question.value?.code && keyVal[1].includes(question.value.code)
        )?.[0];

        if (matrixKey) {
            const optionList = currentASTMatrix.get(matrixKey);
            if (optionList) {
                return optionList;
            }
        }
    };

    return { getAntibioticOptions };
}
