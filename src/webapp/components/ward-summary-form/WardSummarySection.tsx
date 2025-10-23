import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@material-ui/core";
import { FormValue, WardForm } from "../../../domain/entities/Questionnaire/WardForm";
import styled from "styled-components";
import { DataElementCell } from "./DataElementCell";
import { Maybe } from "../../../utils/ts-utils";

type WardSummarySectionProps = {
    hasReadOnlyAccess: boolean;
    wardSummarySection: WardForm;
    getCellBackgroundColor: (formValue: FormValue) => string;
    saveWardSummaryForm: (newValue: Maybe<string>, formValue: any) => void;
};

export const WardSummarySection: React.FC<WardSummarySectionProps> = props => {
    const { hasReadOnlyAccess, wardSummarySection, getCellBackgroundColor, saveWardSummaryForm } =
        props;

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell colSpan={1}></TableCell>
                        {wardSummarySection.columns.map(column => (
                            <StyledTableCell key={column.id} align="center">
                                {column.name}
                            </StyledTableCell>
                        ))}
                    </TableRow>
                </TableHead>

                <TableBody>
                    {wardSummarySection.rows.map((row, rowIndex) => (
                        <TableRow key={row.id}>
                            <StyledTableCell
                                isWhite={rowIndex % 2 !== 0}
                                component="th"
                                scope="row"
                            >
                                {row.name}
                            </StyledTableCell>

                            {row.rowItems.map(formValue => (
                                <StyledTableCell
                                    isWhite={true}
                                    key={getCellId(formValue)}
                                    align="center"
                                >
                                    <DataElementCell
                                        backgroundColor={getCellBackgroundColor(formValue)}
                                        dataValue={formValue.value}
                                        disabled={hasReadOnlyAccess}
                                        onChange={newValue =>
                                            saveWardSummaryForm(newValue, formValue)
                                        }
                                    />
                                </StyledTableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

const StyledTableCell = styled(TableCell)<{ isWhite?: boolean }>`
    background-color: ${props =>
        props.isWhite ? props.theme.palette.white : props.theme.palette.background.hover};
    border-inline-end: 1px solid ${props => props.theme.palette.shadow};
`;

export const getCellId = (formValue: FormValue) =>
    `${formValue.formId}-${formValue.rowId}-${formValue.columnId}`;
