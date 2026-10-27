import styled from "styled-components";
import { Typography } from "@material-ui/core";
import i18n from "@eyeseetea/d2-ui-components/locales";
import { Question } from "../../../domain/entities/Questionnaire/QuestionnaireQuestion";
import { GridRow } from "./GridRow";
import { QuestionnaireSection } from "../../../domain/entities/Questionnaire/QuestionnaireSection";
import { QuestionnaireStage } from "../../../domain/entities/Questionnaire/Questionnaire";
import { SurveySection } from "./SurveySection";
import React from "react";

import { useGridSection } from "./hook/useGridSection";

interface GridSectionProps {
    speciesSection: QuestionnaireSection;
    antibioticStage: QuestionnaireStage;
    updateQuestion: (question: Question) => void;
    viewOnly?: boolean;
}

export const GridSection: React.FC<GridSectionProps> = React.memo(
    ({ speciesSection, antibioticStage, updateQuestion, viewOnly }) => {
        const { updateSpeciesQuestion, grid } = useGridSection(
            speciesSection,
            antibioticStage,
            updateQuestion
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
                    {grid.rows.map(({ option, slot }) => (
                        <GridRow
                            key={option}
                            option={option}
                            antibiotic={slot.antibioticQuestion}
                            astResults={slot.astResultsQuestion}
                            valueQuestion={slot.valueQuestion}
                            updateQuestion={updateQuestion}
                            disabled={Boolean(viewOnly)}
                        />
                    ))}
                </StyledColumn>
                {grid.notShown.length > 0 && (
                    <Typography color="error">
                        {i18n.t(
                            "The form is full: it holds {{capacity}} antibiotic results per species. To add another antibiotic, clear the result of one you do not need. Not shown: {{names}}",
                            { capacity: grid.capacity, names: grid.notShown.join(", ") }
                        )}
                    </Typography>
                )}
                {grid.unknown.length > 0 && (
                    <Typography color="error">
                        {i18n.t(
                            "These antibiotics of the guideline list are missing from the DHIS2 antibiotic list, so their results cannot be saved. Please tell the administrator: {{names}}",
                            { names: grid.unknown.join(", ") }
                        )}
                    </Typography>
                )}
                {grid.hiddenSavedCount > 0 && (
                    <Typography color="error">
                        {i18n.t(
                            "{{count}} saved result(s) cannot be shown, because they were saved without an antibiotic or the same antibiotic was saved twice. Please tell the administrator.",
                            { count: grid.hiddenSavedCount }
                        )}
                    </Typography>
                )}
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
