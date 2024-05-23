import styled from "styled-components";
import { Question } from "../../../domain/entities/Questionnaire/QuestionnaireQuestion";
import { GridRow } from "./GridRow";
import _ from "../../../domain/entities/generic/Collection";
import { QuestionnaireSection } from "../../../domain/entities/Questionnaire/QuestionnaireSection";
import { QuestionnaireStage } from "../../../domain/entities/Questionnaire/Questionnaire";
import { SurveySection } from "./SurveySection";
import React from "react";

import _c from "../../../domain/entities/generic/Collection";
import { useGridSection } from "./hook/useGridSection";

interface GridSectionProps {
    speciesSection: QuestionnaireSection;
    antibioticStage: QuestionnaireStage;
    updateQuestion: (question: Question) => void;
    viewOnly?: boolean;
    antibioticsBlacklist: string[];
}

export const GridSection: React.FC<GridSectionProps> = React.memo(
    ({ speciesSection, antibioticStage, updateQuestion, viewOnly, antibioticsBlacklist }) => {
        const { updateSpeciesQuestion, gridOptions, antibioticSets } = useGridSection(
            speciesSection,
            antibioticStage,
            updateQuestion,
            antibioticsBlacklist
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
                                astResults={currentAntibiotic.astResultsQuestion}
                                valueQuestion={currentAntibiotic.valueQuestion}
                                addNewAntibioticQuestion={
                                    currentAntibiotic.addNewAntibioticQuestion
                                }
                                updateAntibitoticQuestion={updateQuestion}
                                updateAstResults={updateQuestion}
                                updateValue={updateQuestion}
                                updateAddNewAntibiotic={updateQuestion}
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
