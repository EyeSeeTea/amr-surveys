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
import DataElementCell from "./DataElementCell";
import { Maybe } from "../../../utils/ts-utils";

type WardSummarySectionProps = {
    hasReadOnlyAccess: boolean;
    wardSummarySection: WardForm;
    getCellBackgroundColor: (formValue: FormValue) => string;
    saveWardSummaryForm: (newValue: Maybe<string>, formValue: FormValue) => void;
};

export const WardSummarySection: React.FC<WardSummarySectionProps> = props => {
    const { hasReadOnlyAccess, wardSummarySection, getCellBackgroundColor, saveWardSummaryForm } =
        props;

    const normalizedColumnNames = wardSummarySection.columns.map(
        column => column.name?.trim().toLowerCase() ?? ""
    );
    const shouldShowHeader = normalizedColumnNames.some(name => name && name !== "default");

    return (
        <TableContainer>
            <Table>
                {wardSummarySection.columns.length > 0 && shouldShowHeader && (
                    <TableHead>
                        <TableRow>
                            <TableCell colSpan={1}></TableCell>
                            {wardSummarySection.columns.map(column => {
                                const columnName = column.name?.trim() ?? "";
                                const displayName =
                                    columnName.toLowerCase() === "default" ? "" : columnName;
                                return (
                                    <StyledTableCell key={column.id} align="center">
                                        {displayName}
                                    </StyledTableCell>
                                );
                            })}
                        </TableRow>
                    </TableHead>
                )}

                <TableBody>
                    {wardSummarySection.rows.map((row, rowIndex) => (
                        <TableRow key={row.id}>
                            <StyledTableCell
                                $isWhite={rowIndex % 2 !== 0}
                                component="th"
                                scope="row"
                            >
                                {row.name}
                            </StyledTableCell>

                            {row.rowItems.map(formValue => (
                                <StyledTableCell
                                    $isWhite={true}
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

const StyledTableCell = styled(TableCell)<{ $isWhite?: boolean }>`
    background-color: ${props =>
        props.$isWhite ? props.theme.palette.white : props.theme.palette.background.hover};
    border-inline-end: 1px solid ${props => props.theme.palette.shadow};
`;

export const getCellId = (formValue: FormValue) =>
    `${formValue.formId}-${formValue.rowId}-${formValue.columnId}`;
