import { Typography } from "@material-ui/core";
import { Question } from "../../../domain/entities/Questionnaire/QuestionnaireQuestion";
import { QuestionnaireSection } from "../../../domain/entities/Questionnaire/QuestionnaireSection";
import { QuestionWidget } from "../survey-questions/QuestionWidget";
import { PaddedDiv, StyledInput, StyledTitle, StyledWrapper } from "./SurveySection";
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
import _c from "../../../domain/entities/generic/Collection";
import styled from "styled-components";
import { useTableSection } from "./hook/useTableSection";

interface TableSectionProps {
    section: QuestionnaireSection;
    viewOnly?: boolean;
    updateQuestion: (question: Question) => void;
}

export const TableSection: React.FC<TableSectionProps> = ({
    section,
    viewOnly,
    updateQuestion,
}) => {
    const { questionGroups, headerRow } = useTableSection(section);
    return (
        <div key={section.title}>
            <DataTable>
                <TableHead>
                    <DataTableRow>
                        <DataTableColumnHeader colSpan="6">
                            <StyledTitle>{section.title}</StyledTitle>
                        </DataTableColumnHeader>
                    </DataTableRow>
                    <DataTableRow>
                        {headerRow?.map((header, index) => (
                            <DataTableColumnHeader key={index}>{header}</DataTableColumnHeader>
                        ))}
                    </DataTableRow>
                </TableHead>

                <TableBody>
                    {questionGroups?.map(questionGroup => (
                        <>
                            <DataTableRow key={`columns-${questionGroup.groupId}`}>
                                {questionGroup.columnQuestions.map(
                                    question =>
                                        question.isVisible && (
                                            <DataTableCell key={question.code}>
                                                <StyledDataTableCell key={question.code}>
                                                    <QuestionWidget
                                                        onChange={updateQuestion}
                                                        question={question}
                                                        disabled={Boolean(
                                                            question.disabled ||
                                                                question.computed ||
                                                                viewOnly
                                                        )}
                                                    />
                                                    {question.errors.map((err, index) => (
                                                        <div key={index}>
                                                            <Typography
                                                                variant="body2"
                                                                color="error"
                                                            >
                                                                {err}
                                                            </Typography>
                                                        </div>
                                                    ))}
                                                </StyledDataTableCell>
                                            </DataTableCell>
                                        )
                                )}
                            </DataTableRow>
                            <DataTableRow key={`detailQuestion-${questionGroup.groupId}`}>
                                {questionGroup.detailQuestion &&
                                    questionGroup.detailQuestion.isVisible && (
                                        <>
                                            <DataTableCell>
                                                <span>{questionGroup.detailQuestion.text}</span>
                                            </DataTableCell>

                                            <DataTableCell>
                                                <StyledWrapper>
                                                    <StyledInput>
                                                        <QuestionWidget
                                                            onChange={updateQuestion}
                                                            question={questionGroup.detailQuestion}
                                                            disabled={
                                                                questionGroup.detailQuestion
                                                                    .disabled || viewOnly
                                                                    ? true
                                                                    : false
                                                            }
                                                        />
                                                        {questionGroup.detailQuestion.errors.map(
                                                            (err, index) => (
                                                                <PaddedDiv key={index}>
                                                                    <Typography
                                                                        variant="body2"
                                                                        color="error"
                                                                    >
                                                                        {err}
                                                                    </Typography>
                                                                </PaddedDiv>
                                                            )
                                                        )}
                                                    </StyledInput>
                                                </StyledWrapper>
                                            </DataTableCell>
                                        </>
                                    )}
                            </DataTableRow>
                        </>
                    ))}
                </TableBody>
            </DataTable>
        </div>
    );
};

const StyledDataTableCell = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
`;
