import { SortDirection, TableCell, Typography } from "@material-ui/core";
import { Dispatch, SetStateAction } from "react";
import { SortableColumnName, SortColumnDetails } from "../../../../domain/entities/TablePagination";
import i18n from "@eyeseetea/feedback-component/locales";
import { ArrowDownward, ArrowUpward } from "@material-ui/icons";

interface SortableTableCellProps {
    column: SortableColumnName;
    label: string;
    setSortDetails: Dispatch<SetStateAction<SortColumnDetails | undefined>>;
    getSortDirection: (column: SortableColumnName) => SortDirection;
}
export const SortableTableCell: React.FC<SortableTableCellProps> = ({
    column,
    label,
    setSortDetails,
    getSortDirection,
}) => {
    const toggleSortDirection = (direction: SortDirection) => {
        return direction === "asc" ? "desc" : "asc";
    };

    return (
        <TableCell
            onClick={() => {
                setSortDetails({
                    column: column,
                    direction: toggleSortDirection(getSortDirection(column)),
                });
            }}
        >
            <span>
                <Typography variant="caption">{i18n.t(label)}</Typography>
                {getSortDirection(column) === "asc" ? (
                    <ArrowUpward fontSize="small" />
                ) : (
                    <ArrowDownward fontSize="small" />
                )}
            </span>
        </TableCell>
    );
};
