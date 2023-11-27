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
import { useState } from "react";

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

export const SurveyListTable: React.FC<SurveyListTableProps> = ({
    surveys,
    surveyFormType,
    updateSelectedSurveyDetails,
}) => {
    const [options, setOptions] = useState<string[]>([]);
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
    return (
        <>
            {surveys && (
                <TableContentWrapper>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <Typography variant="caption">
                                            {i18n.t("PPS Survey Name")}
                                        </Typography>
                                    </TableCell>
                                    {surveyFormType === "PPSSurveyForm" && (
                                        <>
                                            <TableCell>
                                                <Typography variant="caption">
                                                    {i18n.t("Start Date")}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography variant="caption">
                                                    {i18n.t("Status")}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                <Typography variant="caption">
                                                    {i18n.t("Survey Type")}
                                                </Typography>
                                            </TableCell>
                                        </>
                                    )}

                                    {surveyFormType === "PPSPatientRegister" && (
                                        <>
                                            <TableCell>
                                                <Typography variant="caption">
                                                    {i18n.t("Patient Id")}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption">
                                                    {i18n.t("Patient Name")}
                                                </Typography>
                                            </TableCell>
                                        </>
                                    )}
                                    {surveyFormType === "PPSWardRegister" && (
                                        <TableCell>
                                            <Typography variant="caption">
                                                {i18n.t("Ward Code")}
                                            </Typography>
                                        </TableCell>
                                    )}

                                    {surveyFormType === "PPSHospitalForm" && (
                                        <TableCell>
                                            <Typography variant="caption">
                                                {i18n.t("Hospital Code")}
                                            </Typography>
                                        </TableCell>
                                    )}
                                    <TableCell style={{ cursor: "pointer" }}>
                                        <Typography variant="caption">
                                            {i18n.t("Assigned Org Unit")}
                                        </Typography>
                                    </TableCell>
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
                                            <TableCell>{survey.assignedOrgUnit.name}</TableCell>
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
            &:after {
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
