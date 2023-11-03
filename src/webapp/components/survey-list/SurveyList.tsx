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
    Backdrop,
    CircularProgress,
} from "@material-ui/core";
import { NavLink, useHistory } from "react-router-dom";

import styled from "styled-components";
import { Id } from "../../../domain/entities/Ref";
import { useSurveys } from "../../hooks/useSurveys";
import { palette } from "../../pages/app/themes/dhis2.theme";
import { ActionMenuButton } from "../action-menu-button/ActionMenuButton";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { CustomCard } from "../custom-card/CustomCard";
import { StyledLoaderContainer } from "../survey/SurveyForm";

interface SurveyListProps {
    parentSurveyId?: Id;
    surveyType: SURVEY_FORM_TYPES;
}
export const SurveyList: React.FC<SurveyListProps> = ({ surveyType, parentSurveyId }) => {
    const { surveys, loading } = useSurveys(surveyType, parentSurveyId);
    const history = useHistory();

    const editSurvey = (surveyId: Id) => {
        history.push({
            pathname: `/survey/${surveyType}/${surveyId}`,
        });
    };

    const assignCountry = (surveyId: Id) => {
        history.push({
            pathname: `/new-survey/PPSCountryQuestionnaire`,
            state: { parentSurveyId: surveyId },
        });
    };

    return (
        <ContentWrapper>
            <Backdrop open={loading} style={{ color: "#fff", zIndex: 1 }}>
                <StyledLoaderContainer>
                    <CircularProgress color="inherit" size={50} />
                </StyledLoaderContainer>
            </Backdrop>

            <CustomCard padding="20px 30px 20px">
                <ButtonWrapper>
                    <Button
                        variant="contained"
                        color="primary"
                        component={NavLink}
                        to={`/new-survey/${surveyType}`}
                        exact={true}
                    >
                        {i18n.t("Create New Survey")}
                    </Button>
                </ButtonWrapper>

                <Typography variant="h3">{i18n.t("Survey List")}</Typography>
                {surveys && (
                    <TableContentWrapper>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
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
                                                <TableCell>
                                                    {survey.startDate?.toDateString() || ""}
                                                </TableCell>
                                                <TableCell>{survey.status}</TableCell>
                                                <TableCell>{survey.surveyType}</TableCell>
                                                <TableCell>{survey.assignedOrgUnit.name}</TableCell>
                                                <TableCell style={{ opacity: 0.5 }}>
                                                    <ActionMenuButton
                                                        options={[
                                                            "Edit",
                                                            "Assign Country",
                                                            "List Countries",
                                                        ]}
                                                        optionClickHandler={[
                                                            {
                                                                option: "Edit",
                                                                handler: () =>
                                                                    editSurvey(survey.id),
                                                            },
                                                            {
                                                                option: "Assign Country",
                                                                handler: () =>
                                                                    assignCountry(survey.id),
                                                            },
                                                            {
                                                                option: "List Countries",
                                                                handler: () => {
                                                                    alert("Coming soon!");
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
