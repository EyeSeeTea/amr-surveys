import { useCallback, useEffect, useState } from "react";
import { useASTGuidelinesOptions } from "../../../hooks/useASTGuidelinesOptions";
import {
    AntibioticSection,
    QuestionnaireSection,
} from "../../../../domain/entities/Questionnaire/QuestionnaireSection";
import {
    Question,
    isASTResultsQuestion,
    isAddNewAntibioticQuestion,
    isAntibioticQuestion,
    isAntibioticValueQuestion,
    isSpeciesQuestion,
} from "../../../../domain/entities/Questionnaire/QuestionnaireQuestion";
import { QuestionnaireStage } from "../../../../domain/entities/Questionnaire/Questionnaire";
import _c from "../../../../domain/entities/generic/Collection";

export const useGridSection = (
    speciesSection: QuestionnaireSection,
    antibioticStage: QuestionnaireStage,
    updateQuestion: (question: Question) => void
) => {
    const { getAntibioticOptions } = useASTGuidelinesOptions();
    const [gridOptions, setGridOptions] = useState<string[]>();
    const [antibioticSets, setAntibioticSets] = useState<AntibioticSection[]>();

    useEffect(() => {
        const speciesQuestion = speciesSection.questions.find(isSpeciesQuestion);
        if (speciesQuestion) {
            const options = getAntibioticOptions(speciesQuestion);
            setGridOptions(options);
        }

        const antibioticSections = antibioticStage.sections.filter(
            section => section.isAntibioticSection
        );
        const antibioticGroups: AntibioticSection[] = _c(
            antibioticSections.map(section => {
                const antibioticQuestion = section?.questions.find(isAntibioticQuestion);
                const astQuestion = section?.questions.find(isASTResultsQuestion);
                const valueQuestion = section?.questions.find(isAntibioticValueQuestion);
                const addNewAntibioticQuestion = section?.questions.find(
                    isAddNewAntibioticQuestion
                );

                if (
                    !antibioticQuestion ||
                    !astQuestion ||
                    !valueQuestion ||
                    !addNewAntibioticQuestion
                )
                    return null;

                const antiBioticSet: AntibioticSection = {
                    antibioticQuestion: antibioticQuestion,
                    astResultsQuestion: astQuestion,
                    valueQuestion: valueQuestion,
                    addNewAntibioticQuestion: addNewAntibioticQuestion,
                };

                return antiBioticSet;
            })
        )
            .compact()
            .value();

        setAntibioticSets(antibioticGroups);
    }, [antibioticStage.sections, getAntibioticOptions, gridOptions, speciesSection.questions]);

    const updateSpeciesQuestion = useCallback(
        (question: Question) => {
            if (isSpeciesQuestion(question)) {
                const options = getAntibioticOptions(question);
                setGridOptions(options);
                antibioticSets?.map(antibioticSet => {
                    if (antibioticSet.addNewAntibioticQuestion?.value) {
                        updateQuestion({
                            ...antibioticSet.addNewAntibioticQuestion,
                            value: false,
                        });
                    }
                    if (antibioticSet.antibioticQuestion?.value) {
                        updateQuestion({
                            ...antibioticSet.antibioticQuestion,
                            value: undefined,
                        });
                    }

                    if (antibioticSet.astResultsQuestion?.value) {
                        updateQuestion({
                            ...antibioticSet.astResultsQuestion,
                            value: undefined,
                        });
                    }
                    if (antibioticSet.valueQuestion?.value) {
                        updateQuestion({
                            ...antibioticSet.valueQuestion,
                            value: undefined,
                        });
                    }
                });
            }
            updateQuestion(question);
        },
        [antibioticSets, getAntibioticOptions, updateQuestion, setGridOptions]
    );

    return { updateSpeciesQuestion, gridOptions, antibioticSets };
};
