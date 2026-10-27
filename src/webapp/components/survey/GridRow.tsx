import SearchableSelect from "../survey-questions/widgets/SearchableSelect";
import {
    ASTResultsQuestion,
    AntibioticQuestion,
    AntibioticValueQuestion,
    Question,
    QuestionOption,
    QuestionnaireQuestion,
} from "../../../domain/entities/Questionnaire/QuestionnaireQuestion";
import TextWidget from "../survey-questions/widgets/TextWidget";
import styled from "styled-components";
import { Typography } from "@material-ui/core";
import { useGridRow } from "./hook/useGridRow";

interface GridRowProps {
    option: string;
    antibiotic: AntibioticQuestion;
    astResults: ASTResultsQuestion;
    valueQuestion: AntibioticValueQuestion;
    updateQuestion: (question: Question) => void;
    disabled: boolean;
}

export const GridRow: React.FC<GridRowProps> = props => {
    const { option, astResults, valueQuestion, disabled } = props;
    const { update } = QuestionnaireQuestion;
    const { updateGridRow } = useGridRow(props);

    return (
        <StyledRow role="group" aria-label={option}>
            <StyledTypo>{option}</StyledTypo>
            <StyledSearchableSelect
                value={astResults.options.find(op => op.id === astResults.value?.id) || null}
                options={astResults.options ?? []}
                onChange={(value: QuestionOption) => updateGridRow(update(astResults, value))}
                disabled={disabled}
                label="Select AST results"
            />

            <StyledTextWidget
                value={valueQuestion?.value}
                onChange={value => updateGridRow(update(valueQuestion, value))}
                disabled={disabled}
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
