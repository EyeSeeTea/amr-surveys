import i18n from "@eyeseetea/feedback-component/locales";
import {
    Button,
    Paper,
    TableCell,
    TableContainer,
    TableHead,
    Typography,
    Table,
    TableBody,
    TableRow,
} from "@material-ui/core";
import { NavLink, useHistory } from "react-router-dom";
import styled from "styled-components";
import { Id, NamedRef } from "../../../domain/entities/Ref";
import { useSurveys } from "../../hooks/useSurveys";
import { palette } from "../../pages/app/themes/dhis2.theme";
import { ActionMenuButton } from "../action-menu-button/ActionMenuButton";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { CustomCard } from "../custom-card/CustomCard";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { ContentLoader } from "../content-loader/ContentLoader";
import {
    getChildSurveyType,
    getSurveyDisplayName,
    getSurveyOptions,
} from "../../../domain/utils/PPSProgramsHelper";
import { useEffect, useState } from "react";
import { getUserAccess } from "../../../domain/utils/menuHelper";
import { useAppContext } from "../../contexts/app-context";
import { useCurrentModule } from "../../contexts/current-module-context";

interface SurveyListProps {
    surveyType: SURVEY_FORM_TYPES;
}
export const SurveyList: React.FC<SurveyListProps> = ({ surveyType }) => {
    const {
        changeCurrentPPSSurveyForm,
        changeCurrentCountryQuestionnaire,
        changeCurrentHospitalForm,
        changeCurrentWardRegister,
        resetCurrentPPSSurveyForm,
        resetCurrentCountryQuestionnaire,
        resetCurrentHospitalForm,
        resetCurrentWardRegister,
    } = useCurrentSurveys();
    const { currentUser } = useAppContext();
    const { currentModule } = useCurrentModule();

    let isAdmin = false;
    if (currentModule)
        isAdmin = getUserAccess(currentModule, currentUser.userGroups).hasAdminAccess;

    const { surveys, loading, error } = useSurveys(surveyType);
    const [options, setOptions] = useState<string[]>([]);

    const history = useHistory();

    useEffect(() => {
        if (surveyType === "PPSHospitalForm" && !isAdmin) {
            resetCurrentPPSSurveyForm();
        }

        if (surveyType === "PPSSurveyForm") {
            resetCurrentCountryQuestionnaire();
        } else if (surveyType === "PPSCountryQuestionnaire") {
            resetCurrentCountryQuestionnaire();
        } else if (surveyType === "PPSHospitalForm") {
            resetCurrentHospitalForm();
        } else if (surveyType === "PPSWardRegister") {
            resetCurrentWardRegister();
        }
    }, [
        isAdmin,
        surveyType,
        resetCurrentPPSSurveyForm,
        resetCurrentCountryQuestionnaire,
        resetCurrentHospitalForm,
        resetCurrentWardRegister,
    ]);

    const updateSelectedSurveyDetails = (survey: NamedRef, orgUnitId: Id, rootSurvey: NamedRef) => {
        if (surveyType === "PPSSurveyForm") changeCurrentPPSSurveyForm(survey);
        else if (surveyType === "PPSCountryQuestionnaire")
            changeCurrentCountryQuestionnaire(survey.id, survey.name, orgUnitId);
        else if (surveyType === "PPSHospitalForm") {
            if (!isAdmin) {
                changeCurrentPPSSurveyForm(rootSurvey);
            }
            changeCurrentHospitalForm(survey.id, survey.name, orgUnitId);
        } else if (surveyType === "PPSWardRegister") changeCurrentWardRegister(survey);
    };

    const editSurvey = (survey: NamedRef, orgUnitId: Id, rootSurvey: NamedRef) => {
        updateSelectedSurveyDetails(survey, orgUnitId, rootSurvey);
        history.push({
            pathname: `/survey/${surveyType}/${survey.id}`,
        });
    };

    const assignChild = (survey: NamedRef, orgUnitId: Id, rootSurvey: NamedRef) => {
        updateSelectedSurveyDetails(survey, orgUnitId, rootSurvey);
        const childSurveyType = getChildSurveyType(surveyType);
        if (childSurveyType) {
            history.push({
                pathname: `/new-survey/${childSurveyType}`,
            });
        } else {
            console.debug("An error occured, unknown survey type");
        }
    };

    const listChildren = (survey: NamedRef, orgUnitId: Id, rootSurvey: NamedRef) => {
        updateSelectedSurveyDetails(survey, orgUnitId, rootSurvey);

        const childSurveyType = getChildSurveyType(surveyType);
        if (childSurveyType)
            history.replace({
                pathname: `/surveys/${childSurveyType}`,
            });
        else {
            console.debug("An error occured, unknown survey type");
        }
    };

    const actionClick = (ppsSurveyType: string) => {
        const currentOptions = getSurveyOptions(surveyType, ppsSurveyType);
        setOptions(currentOptions);
    };

    return (
        <ContentWrapper>
            <ContentLoader loading={loading} error={error} showErrorAsSnackbar={true}>
                <CustomCard padding="20px 30px 20px">
                    {/* Hospital data entry users cannot create new hospital surveys. They can only view the hospital survey list */}
                    {surveyType === "PPSHospitalForm" && !isAdmin ? (
                        <></>
                    ) : (
                        <ButtonWrapper>
                            <Button
                                variant="contained"
                                color="primary"
                                component={NavLink}
                                to={{
                                    pathname: `/new-survey/${surveyType}`,
                                }}
                                exact={true}
                            >
                                {i18n.t(`Create New ${getSurveyDisplayName(surveyType)}`)}
                            </Button>
                        </ButtonWrapper>
                    )}

                    <Typography variant="h3">
                        {i18n.t(`${getSurveyDisplayName(surveyType)} List`)}
                    </Typography>
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
                                            {surveyType === "PPSSurveyForm" && (
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
                                                    {surveyType === "PPSSurveyForm" && (
                                                        <>
                                                            <TableCell>
                                                                {survey.startDate?.toDateString() ||
                                                                    ""}
                                                            </TableCell>
                                                            <TableCell>{survey.status}</TableCell>
                                                            <TableCell>
                                                                {survey.surveyType}
                                                            </TableCell>
                                                        </>
                                                    )}
                                                    <TableCell>
                                                        {survey.assignedOrgUnit.name}
                                                    </TableCell>
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
                                                                            },
                                                                            survey.assignedOrgUnit
                                                                                .id,
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
                                                                            },
                                                                            survey.assignedOrgUnit
                                                                                .id,
                                                                            survey.rootSurvey
                                                                        ),
                                                                },
                                                                {
                                                                    option: "List Countries",

                                                                    handler: () => {
                                                                        listChildren(
                                                                            {
                                                                                id: survey.id,
                                                                                name: survey.name,
                                                                            },
                                                                            survey.assignedOrgUnit
                                                                                .id,
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
                                                                            },
                                                                            survey.assignedOrgUnit
                                                                                .id,
                                                                            survey.rootSurvey
                                                                        ),
                                                                },
                                                                {
                                                                    option: "List Hospitals",

                                                                    handler: () => {
                                                                        listChildren(
                                                                            {
                                                                                id: survey.id,
                                                                                name: survey.name,
                                                                            },
                                                                            survey.assignedOrgUnit
                                                                                .id,
                                                                            survey.rootSurvey
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
                                                                            },
                                                                            survey.assignedOrgUnit
                                                                                .id,
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
                                                                            },
                                                                            survey.assignedOrgUnit
                                                                                .id,
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
                                                                            },
                                                                            survey.assignedOrgUnit
                                                                                .id,
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
                                                                            },
                                                                            survey.assignedOrgUnit
                                                                                .id,
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
                                                                            },
                                                                            survey.assignedOrgUnit
                                                                                .id,
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
                </CustomCard>
            </ContentLoader>
        </ContentWrapper>
    );
};

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 40px;
    h3 {
        font-size: 22px;
        color: ${palette.text.primary};
        font-weight: 500;
    }
`;

const ButtonWrapper = styled.div`
    margin: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
`;
export const StyledTableBody = styled(TableBody)`
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
