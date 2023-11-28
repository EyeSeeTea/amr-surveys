import { Survey, SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
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
import { ActionMenuButton } from "../action-menu-button/ActionMenuButton";
import { palette } from "../../pages/app/themes/dhis2.theme";
import { Id } from "../../../domain/entities/Ref";
import { getChildSurveyType, getSurveyOptions } from "../../../domain/utils/PPSProgramsHelper";
import { useHistory } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowDownward, ArrowUpward } from "@material-ui/icons";
import _ from "../../../domain/entities/generic/Collection";

interface SurveyListTableProps {
    surveys: Survey[] | undefined;
    surveyFormType: SURVEY_FORM_TYPES;
    updateSelectedSurveyDetails: (
        survey: {
            id: Id;
            name: string;
            surveyType: string;
        },
        orgUnitId: Id,
        rootSurvey: {
            id: Id;
            name: string;
            surveyType: string;
        }
    ) => void;
}

export type SortDirection = "asc" | "desc";
export type SurveyColumns = keyof Survey;
export const SurveyListTable: React.FC<SurveyListTableProps> = ({
    surveys,
    surveyFormType,
    updateSelectedSurveyDetails,
}) => {
    const [options, setOptions] = useState<string[]>([]);
    const [sortedSurveys, setSortedSurveys] = useState<Survey[]>();
    //states for column sort
    const [surveyNameSortDirection, setSurveyNameSortDirection] = useState<SortDirection>("asc");
    const [startDateSortDirection, setStartDateSortDirection] = useState<SortDirection>("asc");
    const [statusSortDirection, setStatusSortDirection] = useState<SortDirection>("asc");
    const [surveyTypeSortDirection, setSurveyTypeSortDirection] = useState<SortDirection>("asc");
    const [patientIdSortDirection, setPatientIdSortDirection] = useState<SortDirection>("asc");
    const [patientNameSortDirection, setPatientNameSortDirection] = useState<SortDirection>("asc");
    const [wardCodeSortDirection, setWardCodeSortDirection] = useState<SortDirection>("asc");
    const [hospitalCodeSortDirection, setHospitalCodeSortDirection] =
        useState<SortDirection>("asc");

    useEffect(() => {
        if (surveys) setSortedSurveys(surveys);
    }, [surveys]);

    const history = useHistory();

    const editSurvey = (
        survey: {
            id: Id;
            name: string;
            surveyType: string;
        },
        orgUnitId: Id,
        rootSurvey: {
            id: Id;
            name: string;
            surveyType: string;
        }
    ) => {
        updateSelectedSurveyDetails(survey, orgUnitId, rootSurvey);
        history.push({
            pathname: `/survey/${surveyFormType}/${survey.id}`,
        });
    };

    const assignChild = (
        survey: {
            id: Id;
            name: string;
            surveyType: string;
        },
        orgUnitId: Id,
        rootSurvey: {
            id: Id;
            name: string;
            surveyType: string;
        },
        ppsSurveyType?: string
    ) => {
        updateSelectedSurveyDetails(survey, orgUnitId, rootSurvey);
        const childSurveyType = getChildSurveyType(surveyFormType, ppsSurveyType);
        if (childSurveyType) {
            history.push({
                pathname: `/new-survey/${childSurveyType}`,
            });
        } else {
            console.debug("An error occured, unknown survey type");
        }
    };

    const listChildren = (
        survey: {
            id: Id;
            name: string;
            surveyType: string;
        },
        orgUnitId: Id,
        rootSurvey: {
            id: Id;
            name: string;
            surveyType: string;
        },
        ppsSurveyType?: string
    ) => {
        updateSelectedSurveyDetails(survey, orgUnitId, rootSurvey);

        const childSurveyType = getChildSurveyType(surveyFormType, ppsSurveyType);
        if (childSurveyType)
            history.replace({
                pathname: `/surveys/${childSurveyType}`,
            });
        else {
            console.debug("An error occured, unknown survey type");
        }
    };

    const actionClick = (ppsSurveyType: string) => {
        const currentOptions = getSurveyOptions(surveyFormType, ppsSurveyType);
        setOptions(currentOptions);
    };

    const sortByColumn = (columnName: keyof Survey, sortDirection: SortDirection) => {
        setSortedSurveys(surveys => {
            if (surveys)
                return _(surveys)
                    .sortBy(x => x[columnName], { direction: sortDirection })
                    .value();
        });
    };

    return (
        <>
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
                                                {i18n.t("PPS Survey Name")}
                                            </Typography>
                                            {surveyNameSortDirection === "asc" ? (
                                                <ArrowUpward fontSize="small" />
                                            ) : (
                                                <ArrowDownward fontSize="small" />
                                            )}
                                        </span>
                                    </TableCell>
                                    {surveyFormType === "PPSSurveyForm" && (
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
                                        </>
                                    )}

                                    {surveyFormType === "PPSPatientRegister" && (
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
                                            <TableCell
                                                onClick={() => {
                                                    patientNameSortDirection === "asc"
                                                        ? setPatientNameSortDirection("desc")
                                                        : setPatientNameSortDirection("asc");
                                                    sortByColumn("name", patientNameSortDirection);
                                                }}
                                            >
                                                <span>
                                                    <Typography variant="caption">
                                                        {i18n.t("Patient Name")}
                                                    </Typography>
                                                    {patientNameSortDirection === "asc" ? (
                                                        <ArrowUpward fontSize="small" />
                                                    ) : (
                                                        <ArrowDownward fontSize="small" />
                                                    )}
                                                </span>
                                            </TableCell>
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
                                            <TableCell>{survey.rootSurvey.name}</TableCell>
                                            {surveyFormType === "PPSSurveyForm" && (
                                                <>
                                                    <TableCell>
                                                        {survey.startDate?.toDateString() || ""}
                                                    </TableCell>
                                                    <TableCell>{survey.status}</TableCell>
                                                    <TableCell>{survey.surveyType}</TableCell>
                                                </>
                                            )}

                                            {surveyFormType === "PPSPatientRegister" && (
                                                <>
                                                    <TableCell>{survey.id}</TableCell>
                                                    <TableCell>{survey.name}</TableCell>
                                                </>
                                            )}
                                            {surveyFormType === "PPSWardRegister" && (
                                                <TableCell>{survey.name}</TableCell>
                                            )}
                                            {surveyFormType === "PPSHospitalForm" && (
                                                <TableCell>{survey.name}</TableCell>
                                            )}
                                            <TableCell style={{ opacity: 0.5 }}>
                                                <ActionMenuButton
                                                    onClickHandler={() =>
                                                        actionClick(survey.surveyType)
                                                    }
                                                    options={options}
                                                    optionClickHandler={[
                                                        {
                                                            option: "Edit",
                                                            handler: () =>
                                                                editSurvey(
                                                                    {
                                                                        id: survey.id,
                                                                        name: survey.name,
                                                                        surveyType:
                                                                            survey.surveyType,
                                                                    },
                                                                    survey.assignedOrgUnit.id,
                                                                    survey.rootSurvey
                                                                ),
                                                        },
                                                        {
                                                            option: "Assign Country",
                                                            handler: () =>
                                                                assignChild(
                                                                    {
                                                                        id: survey.id,
                                                                        name: survey.name,
                                                                        surveyType:
                                                                            survey.surveyType,
                                                                    },
                                                                    survey.assignedOrgUnit.id,
                                                                    survey.rootSurvey,
                                                                    survey.surveyType
                                                                ),
                                                        },
                                                        {
                                                            option: "List Countries",

                                                            handler: () => {
                                                                listChildren(
                                                                    {
                                                                        id: survey.id,
                                                                        name: survey.name,
                                                                        surveyType:
                                                                            survey.surveyType,
                                                                    },
                                                                    survey.assignedOrgUnit.id,
                                                                    survey.rootSurvey
                                                                );
                                                            },
                                                        },
                                                        {
                                                            option: "Assign Hospital",
                                                            handler: () =>
                                                                assignChild(
                                                                    {
                                                                        id: survey.id,
                                                                        name: survey.name,
                                                                        surveyType:
                                                                            survey.surveyType,
                                                                    },
                                                                    survey.assignedOrgUnit.id,
                                                                    survey.rootSurvey,
                                                                    survey.surveyType
                                                                ),
                                                        },
                                                        {
                                                            option: "List Hospitals",

                                                            handler: () => {
                                                                listChildren(
                                                                    {
                                                                        id: survey.id,
                                                                        name: survey.name,
                                                                        surveyType:
                                                                            survey.surveyType,
                                                                    },
                                                                    survey.assignedOrgUnit.id,
                                                                    survey.rootSurvey,
                                                                    survey.surveyType
                                                                );
                                                            },
                                                        },
                                                        {
                                                            option: "Assign Ward",
                                                            handler: () =>
                                                                assignChild(
                                                                    {
                                                                        id: survey.id,
                                                                        name: survey.name,
                                                                        surveyType:
                                                                            survey.surveyType,
                                                                    },
                                                                    survey.assignedOrgUnit.id,
                                                                    survey.rootSurvey
                                                                ),
                                                        },
                                                        {
                                                            option: "List Wards",
                                                            handler: () => {
                                                                listChildren(
                                                                    {
                                                                        id: survey.id,
                                                                        name: survey.name,
                                                                        surveyType:
                                                                            survey.surveyType,
                                                                    },
                                                                    survey.assignedOrgUnit.id,
                                                                    survey.rootSurvey
                                                                );
                                                            },
                                                        },
                                                        {
                                                            option: "List Country",
                                                            handler: () => {
                                                                listChildren(
                                                                    {
                                                                        id: survey.id,
                                                                        name: survey.name,
                                                                        surveyType:
                                                                            survey.surveyType,
                                                                    },
                                                                    survey.assignedOrgUnit.id,
                                                                    survey.rootSurvey
                                                                );
                                                            },
                                                        },
                                                        {
                                                            option: "Assign Patient",
                                                            handler: () => {
                                                                assignChild(
                                                                    {
                                                                        id: survey.id,
                                                                        name: survey.name,
                                                                        surveyType:
                                                                            survey.surveyType,
                                                                    },

                                                                    survey.assignedOrgUnit.id,
                                                                    survey.rootSurvey
                                                                );
                                                            },
                                                        },
                                                        {
                                                            option: "List Patients",
                                                            handler: () => {
                                                                listChildren(
                                                                    {
                                                                        id: survey.id,
                                                                        name: survey.name,
                                                                        surveyType:
                                                                            survey.surveyType,
                                                                    },
                                                                    survey.assignedOrgUnit.id,
                                                                    survey.rootSurvey
                                                                );
                                                            },
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
                                        <TableCell>No data found...</TableCell>
                                    </TableRow>
                                </StyledTableBody>
                            )}
                        </Table>
                    </TableContainer>
                </TableContentWrapper>
            )}
        </>
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
        th {
            color: #9e9e9e;
            font-weight: 400;
            font-size: 15px;

            vertical-align: bottom;
            position: relative;
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
