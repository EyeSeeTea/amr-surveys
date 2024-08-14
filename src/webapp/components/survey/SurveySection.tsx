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

import { Typography } from "@material-ui/core";
import styled from "styled-components";
import { QuestionWidget } from "../survey-questions/QuestionWidget";
import { Question } from "../../../domain/entities/Questionnaire/QuestionnaireQuestion";

interface SurveySectionProps {
    title: string;
    questions: Question[];
    updateQuestion: (question: Question) => void;
    viewOnly?: boolean;
}
export const SurveySection: React.FC<SurveySectionProps> = ({
    title,
    questions,
    updateQuestion,
    viewOnly,
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
                                                disabled={
                                                    question.disabled || viewOnly ? true : false
                                                }
                                            />
                                            {question.errors.map((err, index) => (
                                                <PaddedDiv key={index}>
                                                    <Typography variant="body2" color="error">
                                                        {err}
                                                    </Typography>
                                                </PaddedDiv>
                                            ))}
                                        </StyledInput>
                                    </StyledWrapper>
                                </DataTableCell>
                            </DataTableRow>
                        );
                    })}
                </TableBody>
            </DataTable>
        </StyledSection>
    );
};

export const PaddedDiv = styled.div`
    padding: 5px;
`;

const StyledSection = styled.div``;

export const StyledTitle = styled.span`
    fontweight: "bold" as const;
`;

export const StyledWrapper = styled.div`
    display: "flex";
`;

export const StyledInput = styled.div`
    flexgrow: 1;
`;
