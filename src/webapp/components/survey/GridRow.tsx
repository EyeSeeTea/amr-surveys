import SearchableSelect from "../survey-questions/widgets/SearchableSelect";
import {
    AntibioticQuestion,
    Question,
    QuestionOption,
    QuestionnaireQuestion,
    SelectQuestion,
    TextQuestion,
} from "../../../domain/entities/Questionnaire/QuestionnaireQuestion";
import TextWidget from "../survey-questions/widgets/TextWidget";
import styled from "styled-components";
import { useEffect } from "react";
import { Typography } from "@material-ui/core";

interface GridRowProps {
    option: string;
    antibiotic: AntibioticQuestion;
    astResults: SelectQuestion;
    valueQuestion: TextQuestion;
    updateAstResults: (question: Question) => void;
    updateValue: (question: Question) => void;
    updateAntibitoticQuestion: (question: Question) => void;
}

export const GridRow: React.FC<GridRowProps> = ({
    option,
    antibiotic,
    astResults,
    valueQuestion,
    updateAstResults,
    updateValue,
    updateAntibitoticQuestion,
}) => {
    const { update } = QuestionnaireQuestion;

    useEffect(() => {
        const updatedAntibiotic = {
            ...antibiotic,
            value: antibiotic.options.find(op => op.name === option),
        };

        updateAntibitoticQuestion(updatedAntibiotic);
    }, [antibiotic, option, updateAntibitoticQuestion]);

    return (
        <StyledRow>
            <StyledTypo>{option}</StyledTypo>
            <StyledSearchableSelect
                value={astResults.options.find(op => op.id === astResults.value?.id) || null}
                options={astResults.options ?? []}
                onChange={(value: QuestionOption) => updateAstResults(update(astResults, value))}
                disabled={false}
                label="Select AST results"
            />

            <StyledTextWidget
                value={valueQuestion?.value}
                onChange={value => updateValue(update(valueQuestion, value))}
                disabled={false}
                multiline={valueQuestion?.multiline ?? false}
                placeholder="Value (unit)"
            />
        </StyledRow>
    );
};

const StyledRow = styled.div`
    max-width: 30%;
    border: 1px solid black;
    display: flex;
    flex-direction: row;
    gap: 5px;
    padding: 10px;
    align-items: center;
`;

const StyledTypo = styled(Typography)`
    width: 50%;
    max-width: 50%;
    overflow: ellipsis;
    text-align: center;
`;
const StyledSearchableSelect = styled(SearchableSelect)`
    width: 50%;
    max-width: 40%;
    height: 40px;
    max-height: 40px;
`;

const StyledTextWidget = styled(TextWidget)`
    width: 20px;
    max-width: 20px;
`;
