import i18n from "@eyeseetea/feedback-component/locales";
import { Button, Typography } from "@material-ui/core";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { Id, NamedRef } from "../../../domain/entities/Ref";
import { useSurveys } from "../../hooks/useSurveys";
import { palette } from "../../pages/app/themes/dhis2.theme";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { CustomCard } from "../custom-card/CustomCard";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { ContentLoader } from "../content-loader/ContentLoader";
import { getSurveyDisplayName } from "../../../domain/utils/PPSProgramsHelper";
import { useEffect } from "react";
import { getUserAccess } from "../../../domain/utils/menuHelper";
import { useAppContext } from "../../contexts/app-context";
import { useCurrentModule } from "../../contexts/current-module-context";
import { SurveyListTable } from "./SurveyListTable";

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
                    <SurveyListTable
                        surveys={surveys}
                        surveyType={surveyType}
                        updateSelectedSurveyDetails={updateSelectedSurveyDetails}
                    />
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
