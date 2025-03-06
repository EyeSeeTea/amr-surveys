import {
    Survey,
    SURVEY_FORM_TYPES,
    SURVEYS_WITH_CHILD_COUNT,
} from "../../../../domain/entities/Survey";
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
import { Dispatch, SetStateAction, useEffect } from "react";
import { ArrowDownward, ArrowUpward } from "@material-ui/icons";
import _ from "../../../../domain/entities/generic/Collection";
import { useDeleteSurvey } from "../hook/useDeleteSurvey";
import { ContentLoader } from "../../content-loader/ContentLoader";
import { useSurveyListActions } from "../hook/useSurveyListActions";
import { getChildrenName } from "../../../../domain/utils/getChildrenName";
import { isPrevalencePatientChild } from "../../../../domain/utils/PPSProgramsHelper";
import { useOfflineSnackbar } from "../../../hooks/useOfflineSnackbar";
import {
    SortableColumnName,
    SortColumnDetails,
    SortDirection,
} from "../../../../domain/entities/TablePagination";

interface PaginatedSurveyListTableProps {
    surveys: Survey[] | undefined;
    surveyFormType: SURVEY_FORM_TYPES;
    refreshSurveys: Dispatch<SetStateAction<{}>>;
    page: number;
    setPage: Dispatch<SetStateAction<number>>;
    pageSize: number;
    total?: number;
    setSortDetails: Dispatch<SetStateAction<SortColumnDetails | undefined>>;
    getSortDirection: (column: SortableColumnName) => SortDirection;
}

export type SurveyColumns = keyof Survey;

export const PaginatedSurveyListTable: React.FC<PaginatedSurveyListTableProps> = ({
    surveys,
    surveyFormType,
    refreshSurveys,
    page,
    setPage,
    pageSize,
    total,
    setSortDetails,
    getSortDirection,
}) => {
    const { snackbar, offlineError } = useOfflineSnackbar();
    const { loading, deleteCompleteState, showDeleteErrorMsg } = useDeleteSurvey(
        surveyFormType,
        refreshSurveys
    );
    const { options, optionLoading, goToSurvey, assignChild, listChildren, actionClick } =
        useSurveyListActions(surveyFormType, setSortDetails);

    useEffect(() => {
        if (deleteCompleteState?.status === "success") {
            snackbar.success(deleteCompleteState.message);
        }
        if (deleteCompleteState?.status === "error") {
            offlineError(deleteCompleteState.message);
        }
    }, [deleteCompleteState, snackbar, surveys, offlineError]);

    const toggleSortDirection = (direction: SortDirection) => {
        return direction === "asc" ? "desc" : "asc";
    };

    return (
        <ContentLoader loading={loading} error="" showErrorAsSnackbar={false}>
            {surveys && (
                <TableContentWrapper>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        onClick={() => {
                                            setSortDetails({
                                                column: "surveyName",
                                                direction: toggleSortDirection(
                                                    getSortDirection("surveyName")
                                                ),
                                            });
                                        }}
                                    >
                                        <span>
                                            <Typography variant="caption">
                                                {i18n.t("Root Survey Name")}
                                            </Typography>
                                            {getSortDirection("surveyName") === "asc" ? (
                                                <ArrowUpward fontSize="small" />
                                            ) : (
                                                <ArrowDownward fontSize="small" />
                                            )}
                                        </span>
                                    </TableCell>

                                    {(surveyFormType === "PrevalenceFacilityLevelForm" ||
                                        surveyFormType === "PPSCountryQuestionnaire") && (
                                        <TableCell>
                                            <Typography variant="caption">
                                                {i18n.t("Org Unit")}
                                            </Typography>
                                        </TableCell>
                                    )}

                                    {surveyFormType === "PrevalenceFacilityLevelForm" && (
                                        <TableCell>
                                            <Typography variant="caption">
                                                {i18n.t("Facility Code")}
                                            </Typography>
                                        </TableCell>
                                    )}

                                    {(surveyFormType === "PPSSurveyForm" ||
                                        surveyFormType === "PrevalenceSurveyForm") && (
                                        <>
                                            <TableCell
                                                onClick={() => {
                                                    setSortDetails({
                                                        column: "startDate",
                                                        direction: toggleSortDirection(
                                                            getSortDirection("startDate")
                                                        ),
                                                    });
                                                }}
                                            >
                                                <span>
                                                    <Typography variant="caption">
                                                        {i18n.t("Start Date")}
                                                    </Typography>
                                                    {getSortDirection("startDate") === "asc" ? (
                                                        <ArrowUpward fontSize="small" />
                                                    ) : (
                                                        <ArrowDownward fontSize="small" />
                                                    )}
                                                </span>
                                            </TableCell>

                                            <TableCell
                                                onClick={() => {
                                                    setSortDetails({
                                                        column: "status",
                                                        direction: toggleSortDirection(
                                                            getSortDirection("status")
                                                        ),
                                                    });
                                                }}
                                            >
                                                <span>
                                                    <Typography variant="caption">
                                                        {i18n.t("Status")}
                                                    </Typography>
                                                    {getSortDirection("status") === "asc" ? (
                                                        <ArrowUpward fontSize="small" />
                                                    ) : (
                                                        <ArrowDownward fontSize="small" />
                                                    )}
                                                </span>
                                            </TableCell>

                                            {surveyFormType === "PPSSurveyForm" && (
                                                <TableCell
                                                    onClick={() => {
                                                        setSortDetails({
                                                            column: "surveyType",
                                                            direction: toggleSortDirection(
                                                                getSortDirection("surveyType")
                                                            ),
                                                        });
                                                    }}
                                                >
                                                    <span>
                                                        <Typography variant="caption">
                                                            {i18n.t("Survey Type")}
                                                        </Typography>
                                                        {getSortDirection("surveyType") ===
                                                        "asc" ? (
                                                            <ArrowUpward fontSize="small" />
                                                        ) : (
                                                            <ArrowDownward fontSize="small" />
                                                        )}
                                                    </span>
                                                </TableCell>
                                            )}
                                        </>
                                    )}
                                    {surveyFormType === "PPSWardRegister" && (
                                        <TableCell
                                            onClick={() => {
                                                setSortDetails({
                                                    column: "wardCode",
                                                    direction: toggleSortDirection(
                                                        getSortDirection("wardCode")
                                                    ),
                                                });
                                            }}
                                        >
                                            <span>
                                                <Typography variant="caption">
                                                    {i18n.t("Ward Code")}
                                                </Typography>
                                                {getSortDirection("wardCode") === "asc" ? (
                                                    <ArrowUpward fontSize="small" />
                                                ) : (
                                                    <ArrowDownward fontSize="small" />
                                                )}
                                            </span>
                                        </TableCell>
                                    )}

                                    {surveyFormType === "PPSHospitalForm" && (
                                        <TableCell
                                            onClick={() => {
                                                setSortDetails({
                                                    column: "hospitalCode",
                                                    direction: toggleSortDirection(
                                                        getSortDirection("hospitalCode")
                                                    ),
                                                });
                                            }}
                                        >
                                            <span>
                                                <Typography variant="caption">
                                                    {i18n.t("Hospital Code")}
                                                </Typography>
                                                {getSortDirection("hospitalCode") === "asc" ? (
                                                    <ArrowUpward fontSize="small" />
                                                ) : (
                                                    <ArrowDownward fontSize="small" />
                                                )}
                                            </span>
                                        </TableCell>
                                    )}
                                    {(surveyFormType === "PPSPatientRegister" ||
                                        surveyFormType === "PrevalenceCaseReportForm" ||
                                        isPrevalencePatientChild(surveyFormType)) && (
                                        <TableCell
                                            onClick={() => {
                                                setSortDetails({
                                                    column: "uniquePatientId",
                                                    direction: toggleSortDirection(
                                                        getSortDirection("uniquePatientId")
                                                    ),
                                                });
                                            }}
                                        >
                                            <span>
                                                <Typography variant="caption">
                                                    {i18n.t("Patient Id")}
                                                </Typography>
                                                {getSortDirection("uniquePatientId") === "asc" ? (
                                                    <ArrowUpward fontSize="small" />
                                                ) : (
                                                    <ArrowDownward fontSize="small" />
                                                )}
                                            </span>
                                        </TableCell>
                                    )}
                                    {surveyFormType === "PPSPatientRegister" && (
                                        <TableCell
                                            onClick={() => {
                                                setSortDetails({
                                                    column: "uniquePatientCode",
                                                    direction: toggleSortDirection(
                                                        getSortDirection("uniquePatientCode")
                                                    ),
                                                });
                                            }}
                                        >
                                            <span>
                                                <Typography variant="caption">
                                                    {i18n.t("Patient Code")}
                                                </Typography>
                                                {getSortDirection("uniquePatientCode") === "asc" ? (
                                                    <ArrowUpward fontSize="small" />
                                                ) : (
                                                    <ArrowDownward fontSize="small" />
                                                )}
                                            </span>
                                        </TableCell>
                                    )}

                                    <>
                                        {SURVEYS_WITH_CHILD_COUNT.includes(surveyFormType) &&
                                            getChildrenName(surveyFormType).map(childName => (
                                                <TableCell
                                                    // onClick={childOnClick(childName)}
                                                    key={childName}
                                                >
                                                    <span>
                                                        <Typography variant="caption">
                                                            {childName}
                                                        </Typography>
                                                        {/* {childName &&
                                                        getCurrentSortDirection(childName) ===
                                                            "asc" ? (
                                                            <ArrowUpward fontSize="small" />
                                                        ) : (
                                                            <ArrowDownward fontSize="small" />
                                                        )} */}
                                                    </span>
                                                </TableCell>
                                            ))}
                                    </>

                                    <TableCell>
                                        <Typography variant="caption">
                                            {i18n.t("Action")}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            {surveys && surveys.length ? (
                                <StyledTableBody>
                                    {surveys.map(survey => (
                                        <TableRow key={survey.id}>
                                            <TableCell>{`${survey.rootSurvey.name}`}</TableCell>
                                            {(surveyFormType === "PrevalenceFacilityLevelForm" ||
                                                surveyFormType === "PPSCountryQuestionnaire") && (
                                                <TableCell>{survey.assignedOrgUnit.name}</TableCell>
                                            )}
                                            {surveyFormType === "PrevalenceFacilityLevelForm" && (
                                                <TableCell>{survey.facilityCode}</TableCell>
                                            )}

                                            {(surveyFormType === "PPSSurveyForm" ||
                                                surveyFormType === "PrevalenceSurveyForm") && (
                                                <>
                                                    <TableCell>
                                                        {survey.startDate?.toDateString() || ""}
                                                    </TableCell>
                                                    <TableCell>{survey.status}</TableCell>
                                                    {surveyFormType === "PPSSurveyForm" && (
                                                        <TableCell>{survey.surveyType}</TableCell>
                                                    )}
                                                </>
                                            )}

                                            {surveyFormType === "PPSWardRegister" && (
                                                <TableCell>{survey.name}</TableCell>
                                            )}
                                            {surveyFormType === "PPSHospitalForm" && (
                                                <TableCell>{survey.name}</TableCell>
                                            )}

                                            {SURVEYS_WITH_CHILD_COUNT.includes(surveyFormType) &&
                                                survey.childCount?.type === "number" && (
                                                    <TableCell>{survey.childCount.value}</TableCell>
                                                )}
                                            {(surveyFormType === "PPSPatientRegister" ||
                                                surveyFormType === "PrevalenceCaseReportForm" ||
                                                isPrevalencePatientChild(surveyFormType)) && (
                                                <TableCell>{survey.uniquePatient?.id}</TableCell>
                                            )}
                                            {surveyFormType === "PPSPatientRegister" && (
                                                <TableCell>{survey.uniquePatient?.code}</TableCell>
                                            )}

                                            <>
                                                {SURVEYS_WITH_CHILD_COUNT.includes(
                                                    surveyFormType
                                                ) &&
                                                    survey.childCount?.type === "map" &&
                                                    survey.childCount.value.map(
                                                        (option, index: number) => {
                                                            return (
                                                                <TableCell key={index}>
                                                                    {option.count}
                                                                </TableCell>
                                                            );
                                                        }
                                                    )}
                                            </>

                                            <TableCell style={{ opacity: 0.5, width: "30%" }}>
                                                <ActionMenuButton
                                                    onClickHandler={() =>
                                                        actionClick(survey.surveyType, survey)
                                                    }
                                                    options={
                                                        optionLoading
                                                            ? [{ label: i18n.t("Loading...") }]
                                                            : options
                                                    }
                                                    optionClickHandler={[
                                                        {
                                                            option: "Edit",
                                                            handler: () => goToSurvey(survey),
                                                        },
                                                        {
                                                            option: "View",
                                                            handler: () => goToSurvey(survey),
                                                        },
                                                        {
                                                            option: "Delete",
                                                            handler: () =>
                                                                showDeleteErrorMsg(survey),
                                                        },
                                                        {
                                                            option:
                                                                options.find(option =>
                                                                    option.label.startsWith("Add")
                                                                )?.label || "",
                                                            handler: () => assignChild(survey),
                                                        },
                                                        {
                                                            option:
                                                                options.find(option =>
                                                                    option.label.startsWith("List")
                                                                )?.label || "",
                                                            handler: () => listChildren(survey),
                                                        },
                                                        {
                                                            option: "Add New Sample Shipment",
                                                            handler: option =>
                                                                assignChild(survey, option),
                                                        },
                                                        {
                                                            option: "List Sample Shipments",
                                                            handler: option =>
                                                                listChildren(survey, option),
                                                        },
                                                        {
                                                            option: "Add New Central Ref Lab Results",
                                                            handler: option =>
                                                                assignChild(survey, option),
                                                        },
                                                        {
                                                            option: "List Central Ref Labs Results",
                                                            handler: option =>
                                                                listChildren(survey, option),
                                                        },

                                                        {
                                                            option: "Add New Pathogen Isolates Log",
                                                            handler: option =>
                                                                assignChild(survey, option),
                                                        },
                                                        {
                                                            option: "List Pathogen Isolates Logs",
                                                            handler: option =>
                                                                listChildren(survey, option),
                                                        },
                                                        {
                                                            option: "Add New Supranational Ref Results",
                                                            handler: option =>
                                                                assignChild(survey, option),
                                                        },
                                                        {
                                                            option: "List Supranational Refs Results",
                                                            handler: option =>
                                                                listChildren(survey, option),
                                                        },
                                                        {
                                                            option: "Add New D28 Follow-up",
                                                            handler: option =>
                                                                assignChild(survey, option),
                                                        },
                                                        {
                                                            option: "List D28 Follow-up",
                                                            handler: option =>
                                                                listChildren(survey, option),
                                                        },
                                                        {
                                                            option: "Add New Discharge",
                                                            handler: option =>
                                                                assignChild(survey, option),
                                                        },
                                                        {
                                                            option: "List Discharge",
                                                            handler: option =>
                                                                listChildren(survey, option),
                                                        },
                                                        {
                                                            option: "Add New Cohort enrolment",
                                                            handler: option =>
                                                                assignChild(survey, option),
                                                        },
                                                        {
                                                            option: "List Cohort enrolment",
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
                                        <TableCell>{i18n.t("No data found...")} </TableCell>
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
