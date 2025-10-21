import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@material-ui/core";
import { WardForm } from "../../../domain/entities/Questionnaire/WardForm";
import styled from "styled-components";

type WardSummarySectionProps = {
    hasReadOnlyAccess: boolean;
    wardSummarySection: WardForm;
};

export const WardSummarySection: React.FC<WardSummarySectionProps> = props => {
    const { wardSummarySection } = props;

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

                            {row.items.map(item => (
                                <StyledTableCell
                                    isWhite={true}
                                    key={`${item.column.id} - ${item.dataElement}`}
                                    align="center"
                                >
                                    {`${item.column.id} - ${item.dataElement}`}
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
