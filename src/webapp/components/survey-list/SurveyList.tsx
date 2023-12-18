import i18n from "@eyeseetea/feedback-component/locales";
import { Button, Typography } from "@material-ui/core";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { Id } from "../../../domain/entities/Ref";
import { useSurveys } from "../../hooks/useSurveys";
import { palette } from "../../pages/app/themes/dhis2.theme";
import { SurveyBase, SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { CustomCard } from "../custom-card/CustomCard";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { ContentLoader } from "../content-loader/ContentLoader";
import { getSurveyDisplayName, hideCreateNewButton } from "../../../domain/utils/PPSProgramsHelper";
import { getUserAccess } from "../../../domain/utils/menuHelper";
import { useAppContext } from "../../contexts/app-context";
import { useCurrentModule } from "../../contexts/current-module-context";
import { SurveyListTable } from "./SurveyListTable";
import { SurveyListFilters } from "./SurveyListFilters";
import _ from "../../../domain/entities/generic/Collection";
import { useSurveyList } from "./hook/useSurveyList";

interface SurveyListProps {
    surveyFormType: SURVEY_FORM_TYPES;
}
export const SurveyList: React.FC<SurveyListProps> = ({ surveyFormType }) => {
    const {
        currentPPSSurveyForm,
        changeCurrentPPSSurveyForm,
        changeCurrentCountryQuestionnaire,
        changeCurrentHospitalForm,
        changeCurrentWardRegister,
    } = useCurrentSurveys();
    const { currentUser } = useAppContext();
    const { currentModule } = useCurrentModule();

    let isAdmin = false;
    if (currentModule)
        isAdmin = getUserAccess(currentModule, currentUser.userGroups).hasAdminAccess;

    const { surveys, loading, error, page, setPage, pageSize, setPageSize, total } =
        useSurveys(surveyFormType);

    const {
        statusFilter,
        setStatusFilter,
        surveyTypeFilter,
        setSurveyTypeFilter,
        filteredSurveys,
    } = useSurveyList(surveyFormType, isAdmin, surveys);

    const updateSelectedSurveyDetails = (
        survey: SurveyBase,
        orgUnitId: Id,
        rootSurvey: SurveyBase
    ) => {
        if (surveyFormType === "PPSSurveyForm") changeCurrentPPSSurveyForm(survey);
        else if (surveyFormType === "PPSCountryQuestionnaire")
            changeCurrentCountryQuestionnaire(survey.id, survey.name, orgUnitId);
        else if (surveyFormType === "PPSHospitalForm") {
            if (!isAdmin) {
                changeCurrentPPSSurveyForm(rootSurvey);
            }
            changeCurrentHospitalForm(survey.id, survey.name, orgUnitId);
        } else if (surveyFormType === "PPSWardRegister") changeCurrentWardRegister(survey);
    };

    return (
        <ContentWrapper>
            <ContentLoader loading={loading} error={error} showErrorAsSnackbar={true}>
                <CustomCard padding="20px 30px 20px">
                    {/* Hospital data entry users cannot create new hospital surveys. They can only view the hospital survey list */}
                    {!hideCreateNewButton(
                        surveyFormType,
                        isAdmin,
                        currentPPSSurveyForm?.surveyType ? currentPPSSurveyForm?.surveyType : "",
                        surveys
                    ) && (
                        <ButtonWrapper>
                            <Button
                                variant="contained"
                                color="primary"
                                component={NavLink}
                                to={{
                                    pathname: `/new-survey/${surveyFormType}`,
                                }}
                                exact={true}
                            >
                                {i18n.t(`Create New ${getSurveyDisplayName(surveyFormType)}`)}
                            </Button>
                        </ButtonWrapper>
                    )}
                    <Typography variant="h3">
                        {i18n.t(`${getSurveyDisplayName(surveyFormType)} List`)}
                    </Typography>
                    {surveyFormType === "PPSSurveyForm" && (
                        <SurveyListFilters
                            status={statusFilter}
                            setStatus={setStatusFilter}
                            surveyType={surveyTypeFilter}
                            setSurveyType={setSurveyTypeFilter}
                        />
                    )}
                    <SurveyListTable
                        surveys={filteredSurveys}
                        surveyFormType={surveyFormType}
                        updateSelectedSurveyDetails={updateSelectedSurveyDetails}
                        page={page}
                        setPage={setPage}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        total={total}
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
