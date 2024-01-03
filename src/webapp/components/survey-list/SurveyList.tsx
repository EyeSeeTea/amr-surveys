import i18n from "@eyeseetea/feedback-component/locales";
import { Button, Typography } from "@material-ui/core";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { useSurveys } from "../../hooks/useSurveys";
import { palette } from "../../pages/app/themes/dhis2.theme";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { CustomCard } from "../custom-card/CustomCard";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { ContentLoader } from "../content-loader/ContentLoader";
import {
    getSurveyDisplayName,
    hideCreateNewButton,
    PREVALENCE_PATIENT_OPTIONS,
} from "../../../domain/utils/PPSProgramsHelper";
import { getUserAccess } from "../../../domain/utils/menuHelper";
import { useAppContext } from "../../contexts/app-context";
import { useCurrentModule } from "../../contexts/current-module-context";
import { SurveyListTable } from "./table/SurveyListTable";
import { SurveyListFilters } from "./SurveyListFilters";
import _ from "../../../domain/entities/generic/Collection";
import { useFilteredSurveys } from "./hook/useFilteredSurveys";
import { SplitButton } from "../split-button/SplitButton";
import { PaginatedSurveyListTable } from "./table/PaginatedSurveyListTable";
import { useSurveyListActions } from "./hook/useSurveyListActions";

interface SurveyListProps {
    surveyFormType: SURVEY_FORM_TYPES;
}
export const SurveyList: React.FC<SurveyListProps> = ({ surveyFormType }) => {
    const { currentPPSSurveyForm } = useCurrentSurveys();
    const { currentUser } = useAppContext();
    const { currentModule } = useCurrentModule();

    const isAdmin = currentModule
        ? getUserAccess(currentModule, currentUser.userGroups).hasAdminAccess
        : false;

    const {
        surveys,
        loadingSurveys,
        errorSurveys,
        page,
        setPage,
        pageSize,
        total,
        setRefreshSurveys,
    } = useSurveys(surveyFormType);

    const {
        statusFilter,
        setStatusFilter,
        surveyTypeFilter,
        setSurveyTypeFilter,
        filteredSurveys,
    } = useFilteredSurveys(surveyFormType, isAdmin, surveys);

    const { handleSplitButtonClick } = useSurveyListActions(surveyFormType);

    return (
        <ContentWrapper>
            <ContentLoader loading={loadingSurveys} error={errorSurveys} showErrorAsSnackbar={true}>
                <CustomCard padding="20px 30px 20px">
                    {/* Hospital data entry users cannot create new hospital surveys. They can only view the hospital survey list */}

                    {surveyFormType === "PrevalencePatientForms" ? (
                        <ButtonWrapper>
                            <SplitButton
                                options={PREVALENCE_PATIENT_OPTIONS}
                                handleSplitButtonClick={handleSplitButtonClick}
                            />
                        </ButtonWrapper>
                    ) : (
                        <>
                            {!hideCreateNewButton(
                                surveyFormType,
                                isAdmin,
                                currentPPSSurveyForm?.surveyType
                                    ? currentPPSSurveyForm?.surveyType
                                    : "",
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
                                        {i18n.t(
                                            `Create New ${getSurveyDisplayName(surveyFormType)}`
                                        )}
                                    </Button>
                                </ButtonWrapper>
                            )}
                        </>
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

                    {surveyFormType === "PPSPatientRegister" ||
                    surveyFormType === "PrevalencePatientForms" ? (
                        <PaginatedSurveyListTable
                            surveys={filteredSurveys}
                            surveyFormType={surveyFormType}
                            page={page}
                            setPage={setPage}
                            pageSize={pageSize}
                            total={total}
                            refreshSurveys={setRefreshSurveys}
                        />
                    ) : (
                        <SurveyListTable
                            surveys={filteredSurveys}
                            surveyFormType={surveyFormType}
                            refreshSurveys={setRefreshSurveys}
                        />
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
