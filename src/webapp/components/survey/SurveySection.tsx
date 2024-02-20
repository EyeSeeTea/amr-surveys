// @ts-ignore
import {
    // @ts-ignore
    DataTable,
    // @ts-ignore
    TableHead,
    // @ts-ignore
    DataTableRow,
    // @ts-ignore
    DataTableColumnHeader,
    // @ts-ignore
    DataTableCell,
    // @ts-ignore
    TableBody,
} from "@dhis2/ui";
import i18n from "@eyeseetea/feedback-component/locales";
import { Button } from "@material-ui/core";
import styled from "styled-components";
import { muiTheme } from "../../pages/app/themes/dhis2.theme";
import { QuestionWidget } from "../survey-questions/QuestionWidget";
import { Question } from "../../../domain/entities/Questionnaire/QuestionnaireQuestion";

interface SurveySectionProps {
    title: string;
    questions: Question[];
    updateQuestion: (question: Question) => void;
    showAddnew?: boolean;
    showAddQuestion?: string;
    addNewClick?: () => void;
}
export const SurveySection: React.FC<SurveySectionProps> = ({
    title,
    questions,
    updateQuestion,
    showAddnew,
    showAddQuestion,
    addNewClick,
}) => {
    return (
        <StyledSection key={title}>
            <DataTable>
                <TableHead>
                    <DataTableRow>
                        <DataTableColumnHeader colSpan="2">
                            <StyledTitle>{title}</StyledTitle>
                        </DataTableColumnHeader>
                    </DataTableRow>
                </TableHead>

                <TableBody>
                    {questions.map(question => {
                        if (!question.isVisible) return null;
                        return (
                            <DataTableRow key={question.id}>
                                <DataTableCell width="60%">
                                    <span>{question.text}</span>
                                </DataTableCell>

                                <DataTableCell>
                                    <StyledWrapper>
                                        <StyledInput>
                                            <QuestionWidget
                                                onChange={updateQuestion}
                                                question={question}
                                                disabled={question.disabled ? true : false}
                                            />
                                        </StyledInput>
                                    </StyledWrapper>
                                </DataTableCell>
                            </DataTableRow>
                        );
                    })}
                </TableBody>
            </DataTable>
            {showAddnew && addNewClick && (
                <StyledButton onClick={() => addNewClick()}>
                    {questions.find(q => q.id === showAddQuestion)?.text ?? i18n.t("Add new")}
                </StyledButton>
            )}
        </StyledSection>
    );
};

const StyledSection = styled.div`
    margin: 10;
`;

const StyledTitle = styled.span`
    fontweight: "bold" as const;
`;

const StyledWrapper = styled.div`
    display: "flex";
`;

const StyledInput = styled.div`
    flexgrow: 1;
`;

const StyledButton = styled(Button)`
    color: white;
    background-color: ${muiTheme.palette.primary.main};
    margin: 10px 5px 10px 0px;
    text-transform: none;
    float: right;
    &:hover {
        background-color: ${muiTheme.palette.primary.main};
        opacity: 0.7;
    }
`;
