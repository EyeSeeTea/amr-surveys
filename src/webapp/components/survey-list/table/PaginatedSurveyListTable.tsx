import { Survey, SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import styled from "styled-components";
import {
    TableBody,
    TableContainer,
    Table,
    TableRow,
    Paper,
    TableCell,
    TableHead,
    Typography,
    TablePagination,
} from "@material-ui/core";
import i18n from "@eyeseetea/feedback-component/locales";
import { ActionMenuButton } from "../../action-menu-button/ActionMenuButton";
import { palette } from "../../../pages/app/themes/dhis2.theme";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { ArrowDownward, ArrowUpward } from "@material-ui/icons";
import _ from "../../../../domain/entities/generic/Collection";
import { useDeleteSurvey } from "../hook/useDeleteSurvey";
import { ContentLoader } from "../../content-loader/ContentLoader";
import { useSurveyListActions } from "../hook/useSurveyListActions";

interface PaginatedSurveyListTableProps {
    surveys: Survey[] | undefined;
    surveyFormType: SURVEY_FORM_TYPES;
    refreshSurveys: Dispatch<SetStateAction<{}>>;
    page: number;
    setPage: Dispatch<SetStateAction<number>>;
    pageSize: number;
    total?: number;
}

export type SortDirection = "asc" | "desc";
export type SurveyColumns = keyof Survey;
export const PaginatedSurveyListTable: React.FC<PaginatedSurveyListTableProps> = ({
    surveys,
    surveyFormType,
    refreshSurveys,
    page,
    setPage,
    pageSize,
    total,
}) => {
    const snackbar = useSnackbar();
    //states for column sort
    const [surveyNameSortDirection, setSurveyNameSortDirection] = useState<SortDirection>("asc");
    const [patientIdSortDirection, setPatientIdSortDirection] = useState<SortDirection>("asc");

    const { deleteSurvey, loading, deleteCompleteState } = useDeleteSurvey(
        surveyFormType,
        refreshSurveys
    );
    const {
        options,
        optionLoading,
        sortedSurveys,
        setSortedSurveys,
        editSurvey,
        assignChild,
        listChildren,
        actionClick,
        sortByColumn,
    } = useSurveyListActions(surveyFormType);

    useEffect(() => {
        if (surveys) setSortedSurveys(surveys);

        if (deleteCompleteState?.status === "success") {
            snackbar.success(deleteCompleteState.message);
        }
        if (deleteCompleteState?.status === "error") {
            snackbar.error(deleteCompleteState.message);
        }
    }, [deleteCompleteState, snackbar, surveys, setSortedSurveys]);

    return (
        <ContentLoader loading={loading} error="" showErrorAsSnackbar={false}>
            {sortedSurveys && (
                <TableContentWrapper>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        onClick={() => {
                                            surveyNameSortDirection === "asc"
                                                ? setSurveyNameSortDirection("desc")
                                                : setSurveyNameSortDirection("asc");
                                            sortByColumn("name", surveyNameSortDirection);
                                        }}
                                    >
                                        <span>
                                            <Typography variant="caption">
                                                {i18n.t("Root Survey Name")}
                                            </Typography>
                                            {surveyNameSortDirection === "asc" ? (
                                                <ArrowUpward fontSize="small" />
                                            ) : (
                                                <ArrowDownward fontSize="small" />
                                            )}
                                        </span>
                                    </TableCell>

                                    <>
                                        <TableCell
                                            onClick={() => {
                                                patientIdSortDirection === "asc"
                                                    ? setPatientIdSortDirection("desc")
                                                    : setPatientIdSortDirection("asc");
                                                sortByColumn("id", patientIdSortDirection);
                                            }}
                                        >
                                            <span>
                                                <Typography variant="caption">
                                                    {i18n.t("Patient Id")}
                                                </Typography>
                                                {patientIdSortDirection === "asc" ? (
                                                    <ArrowUpward fontSize="small" />
                                                ) : (
                                                    <ArrowDownward fontSize="small" />
                                                )}
                                            </span>
                                        </TableCell>
                                    </>

                                    <TableCell>
                                        <Typography variant="caption">
                                            {i18n.t("Action")}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            {sortedSurveys && sortedSurveys.length ? (
                                <StyledTableBody>
                                    {sortedSurveys.map(survey => (
                                        <TableRow key={survey.id}>
                                            <TableCell>{`${survey.rootSurvey.name}`}</TableCell>

                                            <TableCell>{survey.uniqueSurveyPatientId}</TableCell>

                                            <TableCell style={{ opacity: 0.5 }}>
                                                <ActionMenuButton
                                                    onClickHandler={() =>
                                                        actionClick(survey.surveyType, survey)
                                                    }
                                                    options={
                                                        optionLoading
                                                            ? [i18n.t("Loading...")]
                                                            : options
                                                    }
                                                    optionClickHandler={[
                                                        {
                                                            option: "Edit",
                                                            handler: () => editSurvey(survey),
                                                        },
                                                        {
                                                            option: "Delete",
                                                            handler: () =>
                                                                deleteSurvey(
                                                                    survey.id,
                                                                    survey.assignedOrgUnit.id
                                                                ),
                                                        },
                                                        {
                                                            option:
                                                                options.find(op =>
                                                                    op.startsWith(
                                                                        "Add New Sample Shipment"
                                                                    )
                                                                ) ?? "",
                                                            handler: option =>
                                                                assignChild(survey, option),
                                                        },
                                                        {
                                                            option:
                                                                options.find(op =>
                                                                    op.startsWith(
                                                                        "List Sample Shipments"
                                                                    )
                                                                ) ?? "",
                                                            handler: option =>
                                                                listChildren(survey, option),
                                                        },
                                                        {
                                                            option:
                                                                options.find(op =>
                                                                    op.startsWith(
                                                                        "Add New Central Ref Lab Results"
                                                                    )
                                                                ) ?? "",
                                                            handler: option =>
                                                                assignChild(survey, option),
                                                        },
                                                        {
                                                            option:
                                                                options.find(op =>
                                                                    op.startsWith(
                                                                        "List Central Ref Labs Results"
                                                                    )
                                                                ) ?? "",
                                                            handler: option =>
                                                                listChildren(survey, option),
                                                        },

                                                        {
                                                            option:
                                                                options.find(op =>
                                                                    op.startsWith(
                                                                        "Add New Pathogen Isolates Log"
                                                                    )
                                                                ) ?? "",
                                                            handler: option =>
                                                                assignChild(survey, option),
                                                        },
                                                        {
                                                            option:
                                                                options.find(op =>
                                                                    op.startsWith(
                                                                        "List Pathogen Isolates Logs"
                                                                    )
                                                                ) ?? "",
                                                            handler: option =>
                                                                listChildren(survey, option),
                                                        },
                                                        {
                                                            option:
                                                                options.find(op =>
                                                                    op.startsWith(
                                                                        "Add New Supranational Ref Results"
                                                                    )
                                                                ) ?? "",
                                                            handler: option =>
                                                                assignChild(survey, option),
                                                        },
                                                        {
                                                            option:
                                                                options.find(op =>
                                                                    op.startsWith(
                                                                        "List Supranational Refs Results"
                                                                    )
                                                                ) ?? "",
                                                            handler: option =>
                                                                listChildren(survey, option),
                                                        },
                                                    ]}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </StyledTableBody>
                            ) : (
                                <StyledTableBody>
                                    <TableRow>
                                        <TableCell> {i18n.t("No data found...")}</TableCell>
                                    </TableRow>
                                </StyledTableBody>
                            )}
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[]}
                        component="div"
                        count={total || 0}
                        rowsPerPage={pageSize}
                        page={page}
                        onPageChange={(_e, page) => setPage(page)}
                    />
                </TableContentWrapper>
            )}
        </ContentLoader>
    );
};

const TableContentWrapper = styled.div`
    h3 {
        font-size: 22px;
        color: ${palette.text.primary};
        font-weight: 500;
    }
    .MuiTableContainer-root {
        border: none;
        box-shadow: none;
    }
    thead {
        border-bottom: 3px solid #e0e0e0;
        min-height: 100px;
        th {
            color: #9e9e9e;
            font-weight: 400;
            font-size: 15px;
            vertical-align: bottom;
            position: relative;
            padding-block-end: 30px;
            &:not(:last-child):after {
                content: "";
                height: 25px;
                border-right: 2px solid #e0e0e0;
                position: absolute;
                right: 0;
                top: 30px;
            }
        }
    }
    tbody {
        tr {
            border: none;
            &:hover {
                transition: background-color ease-in-out 300ms;
                background-color: #e0e0e0;
            }
            td {
                border-bottom: 1px solid #e0e0e0;
            }
        }
    }
    &.error-group {
        tbody {
            td:nth-child(7) {
                color: #c62828;
                opacity: 1;
            }
        }
    }
`;
const StyledTableBody = styled(TableBody)`
    td.cta {
        text-align: center;
        svg {
            color: "#9E9E9E";
        }
        &:hover {
            svg {
                color: "#494949";
            }
        }
    }
`;
