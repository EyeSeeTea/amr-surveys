import { useEffect, useState } from "react";
import { useCurrentASTGuidelinesContext } from "../contexts/current-ast-guidelines-context";
import { useCurrentSurveys } from "../contexts/current-surveys-context";
import {
    AntibioticQuestion,
    SpeciesQuestion,
    isSpeciesQuestion,
} from "../../domain/entities/Questionnaire/QuestionnaireQuestion";
import { Questionnaire } from "../../domain/entities/Questionnaire/Questionnaire";
import _ from "../../domain/entities/generic/Collection";
import { QuestionnaireSectionM } from "../../domain/entities/Questionnaire/QuestionnaireSection";

export function useASTGuidelinesOptions() {
    const { currentASTGuidelines } = useCurrentASTGuidelinesContext();
    const { currentPrevalenceSurveyForm } = useCurrentSurveys();

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

    const getAntibioticOptions = (question: SpeciesQuestion): string[] | undefined => {
        const matrixKey = [...currentASTList].find(
            keyVal => question.value?.code && keyVal[1].includes(question.value.code)
        )?.[0];

        return matrixKey ? currentASTMatrix.get(matrixKey) : undefined;
    };

    const getSpeciesQuestionForAntibiotic = (
        question: AntibioticQuestion,
        questionnaire: Questionnaire
    ): SpeciesQuestion | undefined => {
        const currentStage = questionnaire.stages.find(stage => stage.id === question.stageId);

        if (!currentStage) return undefined;
        const speciesSection = QuestionnaireSectionM.getSpeciesSection(currentStage?.sections);

        const speciesQuestion: SpeciesQuestion | undefined = speciesSection?.questions?.find(
            q => q.type === "select" && isSpeciesQuestion(q)
        ) as SpeciesQuestion;

        return speciesQuestion;
    };
    return { getAntibioticOptions, getSpeciesQuestionForAntibiotic };
}
