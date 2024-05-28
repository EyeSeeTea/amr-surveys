import { useCallback, useEffect, useState } from "react";
import { useCurrentASTGuidelinesContext } from "../contexts/current-ast-guidelines-context";
import { useCurrentSurveys } from "../contexts/current-surveys-context";
import { SpeciesQuestion } from "../../domain/entities/Questionnaire/QuestionnaireQuestion";
import _ from "../../domain/entities/generic/Collection";
import { useCurrentModule } from "../contexts/current-module-context";

export function useASTGuidelinesOptions() {
    const { currentASTGuidelines } = useCurrentASTGuidelinesContext();
    const { currentPrevalenceSurveyForm } = useCurrentSurveys();
    const { currentModule } = useCurrentModule();

    const [currentASTMatrix, setCurrentASTMatrix] = useState<Map<string, string[]>>(new Map());
    const [currentASTList, setCurrentASTList] = useState<Map<string, string[]>>(new Map());

    useEffect(() => {
        const currentList =
            currentPrevalenceSurveyForm?.astGuidelines === currentASTGuidelines?.type
                ? currentASTGuidelines.lists
                : new Map();

        setCurrentASTList(currentList);

        const currentMatrix =
            currentPrevalenceSurveyForm?.astGuidelines === currentASTGuidelines?.type
                ? currentASTGuidelines.matrix
                : new Map();

        setCurrentASTMatrix(currentMatrix);
    }, [currentASTGuidelines, currentPrevalenceSurveyForm]);

    const getAntibioticOptions = useCallback(
        (question: SpeciesQuestion): string[] | undefined => {
            const matrixKey = [...currentASTList].find(
                keyVal => question.value?.code && keyVal[1].includes(question.value.code)
            )?.[0];

            if (matrixKey) {
                const antibioticsBlacklist = currentModule?.rulesBySurvey?.find(
                    rule => rule.surveyId === currentPrevalenceSurveyForm?.id
                )?.antibioticBlacklist;

                return currentASTMatrix
                    .get(matrixKey)
                    ?.filter(
                        antibioticOption =>
                            !antibioticsBlacklist?.some(blacklist =>
                                antibioticOption.toLowerCase().includes(blacklist.toLowerCase())
                            )
                    );
            } else return undefined;
        },
        [
            currentASTList,
            currentASTMatrix,
            currentModule?.rulesBySurvey,
            currentPrevalenceSurveyForm?.id,
        ]
    );

    return { getAntibioticOptions };
}
