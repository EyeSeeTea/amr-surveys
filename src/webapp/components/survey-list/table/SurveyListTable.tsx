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
} from "@material-ui/core";
import i18n from "@eyeseetea/feedback-component/locales";
import { ActionMenuButton } from "../../action-menu-button/ActionMenuButton";
import { palette } from "../../../pages/app/themes/dhis2.theme";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { ArrowDownward, ArrowUpward } from "@material-ui/icons";
import _ from "../../../../domain/entities/generic/Collection";
import { useDeleteSurvey } from "../hook/useDeleteSurvey";
import { ContentLoader } from "../../content-loader/ContentLoader";
import { SortDirection, useSurveyListActions } from "../hook/useSurveyListActions";
import { getChildrenName } from "../../../../domain/utils/getChildrenName";
import { useOfflineSnackbar } from "../../../hooks/useOfflineSnackbar";

interface SurveyListTableProps {
    surveys: Survey[] | undefined;
    surveyFormType: SURVEY_FORM_TYPES;
    refreshSurveys: Dispatch<SetStateAction<{}>>;
}

export type SurveyColumns = keyof Survey;
export const SurveyListTable: React.FC<SurveyListTableProps> = ({
    surveys,
    surveyFormType,
    refreshSurveys,
}) => {
    const { snackbar, offlineError } = useOfflineSnackbar();

    //states for column sort
    const [surveyNameSortDirection, setSurveyNameSortDirection] = useState<SortDirection>("asc");
    const [startDateSortDirection, setStartDateSortDirection] = useState<SortDirection>("asc");
    const [childrenSortDirection, setChildrenSortDirection] = useState<SortDirection>("asc");
    const [statusSortDirection, setStatusSortDirection] = useState<SortDirection>("asc");
    const [surveyTypeSortDirection, setSurveyTypeSortDirection] = useState<SortDirection>("asc");
    const [wardCodeSortDirection, setWardCodeSortDirection] = useState<SortDirection>("asc");
    const [hospitalCodeSortDirection, setHospitalCodeSortDirection] =
        useState<SortDirection>("asc");

    const { loading, deleteCompleteState, showDeleteErrorMsg } = useDeleteSurvey(
        surveyFormType,
        refreshSurveys
    );
    const {
        options,
        optionLoading,
        sortedSurveys,
        setSortedSurveys,
        goToSurvey,
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
            offlineError(deleteCompleteState.message);
        }
    }, [deleteCompleteState, snackbar, surveys, offlineError, setSortedSurveys]);

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
                                                    startDateSortDirection === "asc"
                                                        ? setStartDateSortDirection("desc")
                                                        : setStartDateSortDirection("asc");
                                                    sortByColumn(
                                                        "startDate",
                                                        startDateSortDirection
                                                    );
                                                }}
                                            >
                                                <span>
                                                    <Typography variant="caption">
                                                        {i18n.t("Start Date")}
                                                    </Typography>
                                                    {startDateSortDirection === "asc" ? (
                                                        <ArrowUpward fontSize="small" />
                                                    ) : (
                                                        <ArrowDownward fontSize="small" />
                                                    )}
                                                </span>
                                            </TableCell>

                                            <TableCell
                                                onClick={() => {
                                                    statusSortDirection === "asc"
                                                        ? setStatusSortDirection("desc")
                                                        : setStatusSortDirection("asc");
                                                    sortByColumn("status", statusSortDirection);
                                                }}
                                            >
                                                <span>
                                                    <Typography variant="caption">
                                                        {i18n.t("Status")}
                                                    </Typography>
                                                    {statusSortDirection === "asc" ? (
                                                        <ArrowUpward fontSize="small" />
                                                    ) : (
                                                        <ArrowDownward fontSize="small" />
                                                    )}
                                                </span>
                                            </TableCell>

                                            {surveyFormType === "PPSSurveyForm" && (
                                                <TableCell
                                                    onClick={() => {
                                                        surveyTypeSortDirection === "asc"
                                                            ? setSurveyTypeSortDirection("desc")
                                                            : setSurveyTypeSortDirection("asc");
                                                        sortByColumn(
                                                            "surveyType",
                                                            surveyTypeSortDirection
                                                        );
                                                    }}
                                                >
                                                    <span>
                                                        <Typography variant="caption">
                                                            {i18n.t("Survey Type")}
                                                        </Typography>
                                                        {surveyTypeSortDirection === "asc" ? (
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
                                                wardCodeSortDirection === "asc"
                                                    ? setWardCodeSortDirection("desc")
                                                    : setWardCodeSortDirection("asc");
                                                sortByColumn("name", wardCodeSortDirection);
                                            }}
                                        >
                                            <span>
                                                <Typography variant="caption">
                                                    {i18n.t("Ward Code")}
                                                </Typography>
                                                {wardCodeSortDirection === "asc" ? (
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
                                                hospitalCodeSortDirection === "asc"
                                                    ? setHospitalCodeSortDirection("desc")
                                                    : setHospitalCodeSortDirection("asc");
                                                sortByColumn("name", hospitalCodeSortDirection);
                                            }}
                                        >
                                            <span>
                                                <Typography variant="caption">
                                                    {i18n.t("Hospital Code")}
                                                </Typography>
                                                {hospitalCodeSortDirection === "asc" ? (
                                                    <ArrowUpward fontSize="small" />
                                                ) : (
                                                    <ArrowDownward fontSize="small" />
                                                )}
                                            </span>
                                        </TableCell>
                                    )}

                                    {SURVEYS_WITH_CHILD_COUNT.includes(surveyFormType) && (
                                        <TableCell
                                            onClick={() => {
                                                childrenSortDirection === "asc"
                                                    ? setChildrenSortDirection("desc")
                                                    : setChildrenSortDirection("asc");
                                                sortByColumn("childCount", childrenSortDirection);
                                            }}
                                        >
                                            <span>
                                                <Typography variant="caption">
                                                    {getChildrenName(surveyFormType)}
                                                </Typography>
                                                {childrenSortDirection === "asc" ? (
                                                    <ArrowUpward fontSize="small" />
                                                ) : (
                                                    <ArrowDownward fontSize="small" />
                                                )}
                                            </span>
                                        </TableCell>
                                    )}

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

                                            <TableCell style={{ opacity: 0.5 }}>
                                                {
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
                                                                        option.label.startsWith(
                                                                            "New"
                                                                        )
                                                                    )?.label || "",
                                                                handler: () => assignChild(survey),
                                                            },
                                                            {
                                                                option:
                                                                    options.find(option =>
                                                                        option.label.startsWith(
                                                                            "List"
                                                                        )
                                                                    )?.label || "",
                                                                handler: () => listChildren(survey),
                                                            },
                                                        ]}
                                                    />
                                                }
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
