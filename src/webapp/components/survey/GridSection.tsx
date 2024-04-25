import styled from "styled-components";
import {
    AntibioticQuestion,
    Question,
    SelectQuestion,
    TextQuestion,
    isAntibioticQuestion,
    isSpeciesQuestion,
} from "../../../domain/entities/Questionnaire/QuestionnaireQuestion";
import { GridRow } from "./GridRow";
import _ from "../../../domain/entities/generic/Collection";
import { AntibioticSection } from "./SurveyForm";
import { QuestionnaireSection } from "../../../domain/entities/Questionnaire/QuestionnaireSection";
import { QuestionnaireStage } from "../../../domain/entities/Questionnaire/Questionnaire";
import { SurveySection } from "./SurveySection";
import React, { useCallback, useEffect, useState } from "react";
import { useASTGuidelinesOptions } from "../../hooks/useASTGuidelinesOptions";

interface GridSectionProps {
    speciesSection: QuestionnaireSection;
    antibioticStage: QuestionnaireStage;
    updateQuestion: (question: Question) => void;
    viewOnly?: boolean;
}

export const GridSection: React.FC<GridSectionProps> = React.memo(
    ({ speciesSection, antibioticStage, updateQuestion, viewOnly }) => {
        const [gridOptions, setGridOptions] = useState<string[]>();
        const { getAntibioticOptions } = useASTGuidelinesOptions();
        const [antibioticSets, setAntibioticSets] = useState<AntibioticSection[]>();

        useEffect(() => {
            console.debug("GridSection useEffect");
            const speciesQuestion = speciesSection.questions.find(
                question => question.type === "select" && isSpeciesQuestion(question)
            );
            if (speciesQuestion?.type === "select" && isSpeciesQuestion(speciesQuestion)) {
                const options = getAntibioticOptions(speciesQuestion);
                setGridOptions(options);
            }

            const antibioticSections = antibioticStage.sections.filter(
                section => section.isAntibioticSection
            );
            const antibioticGroups: AntibioticSection[] = antibioticSections.map(section => {
                const antibioticQuestion = section?.questions.find(
                    q => q.type === "select" && isAntibioticQuestion(q)
                );

                const astQuestion = section?.questions.find(
                    q => q.type === "select" && q.text === "AST results"
                );

                const valueQuestion = section?.questions.find(
                    q => q.type === "text" && q.text === "Value (unit)"
                );
                // if (!antibioticQuestion || !astQuestion || !valueQuestion) return null;

                return {
                    antibioticQuestion: antibioticQuestion as unknown as AntibioticQuestion,
                    astResults: astQuestion as unknown as SelectQuestion,
                    valueQuestion: valueQuestion as unknown as TextQuestion,
                };
            });

            setAntibioticSets(antibioticGroups);
        }, [antibioticStage.sections, getAntibioticOptions, gridOptions, speciesSection.questions]);

        const updateSpeciesQuestion = useCallback(
            (question: Question) => {
                if (question.type === "select" && isSpeciesQuestion(question)) {
                    const options = getAntibioticOptions(question);
                    setGridOptions(options);
                }
                updateQuestion(question);
            },
            [getAntibioticOptions, updateQuestion]
        );

        return (
            <>
                <SurveySection
                    key={speciesSection.code}
                    title={speciesSection.title}
                    questions={speciesSection.questions}
                    viewOnly={viewOnly}
                    updateQuestion={updateSpeciesQuestion}
                />
                <StyledColumn>
                    {gridOptions?.map((option, index) => {
                        const currentAntibiotic = antibioticSets?.at(index);
                        if (!currentAntibiotic) return null;

                        return (
                            <GridRow
                                key={option}
                                option={option}
                                antibiotic={currentAntibiotic.antibioticQuestion}
                                astResults={currentAntibiotic.astResults}
                                valueQuestion={currentAntibiotic.valueQuestion}
                                updateAntibitoticQuestion={updateQuestion}
                                updateAstResults={updateQuestion}
                                updateValue={updateQuestion}
                            />
                        );
                    })}
                </StyledColumn>
            </>
        );
    }
);

const StyledColumn = styled.div`
    display: flex;
    flex-flow: row wrap;
    max-width: 100%;
    padding-top: 10px;
    gap: 30px;
`;
