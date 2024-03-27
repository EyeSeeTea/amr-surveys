import i18n from "@eyeseetea/feedback-component/locales";
import { Backdrop, Button, CircularProgress, TextField, Typography } from "@material-ui/core";
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
    isPaginatedSurveyList,
} from "../../../domain/utils/PPSProgramsHelper";
import { getUserAccess } from "../../../domain/utils/menuHelper";
import { useAppContext } from "../../contexts/app-context";
import { useCurrentModule } from "../../contexts/current-module-context";
import { SurveyListTable } from "./table/SurveyListTable";
import { SurveyListFilters } from "./SurveyListFilters";
import _ from "../../../domain/entities/generic/Collection";
import { useFilteredSurveys } from "./hook/useFilteredSurveys";
import { PaginatedSurveyListTable } from "./table/PaginatedSurveyListTable";
import { usePatientSearch } from "./hook/usePatientSearch";
import useReadAccess from "../survey/hook/useReadAccess";

interface SurveyListProps {
    surveyFormType: SURVEY_FORM_TYPES;
}
export const SurveyList: React.FC<SurveyListProps> = ({ surveyFormType }) => {
    const { currentPPSSurveyForm } = useCurrentSurveys();
    const { currentUser } = useAppContext();
    const { currentModule } = useCurrentModule();
    const { hasReadAccess } = useReadAccess();

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
        setPageSize,
        total,
        setTotal,
        setRefreshSurveys,
    } = useSurveys(surveyFormType);

    const {
        statusFilter,
        setStatusFilter,
        surveyTypeFilter,
        setSurveyTypeFilter,
        filteredSurveys,
    } = useFilteredSurveys(surveyFormType, isAdmin, surveys);

    const {
        searchResultSurveys,
        patientSearchKeyword,
        setPatientSearchKeyword,
        handleKeyPress,
        isLoading,
    } = usePatientSearch(filteredSurveys, surveyFormType, setPageSize, setTotal);

    return (
        <ContentWrapper>
            <ContentLoader loading={loadingSurveys} error={errorSurveys} showErrorAsSnackbar={true}>
                <CustomCard padding="20px 30px 20px">
                    {/* Hospital data entry users cannot create new hospital surveys. They can only view the hospital survey list */}
                    <>
                        {!hideCreateNewButton(
                            surveyFormType,
                            isAdmin,
                            hasReadAccess,
                            currentPPSSurveyForm?.surveyType
                                ? currentPPSSurveyForm?.surveyType
                                : "",
                            surveys
                        ) && (
                            <ButtonWrapper>
                                {surveyFormType === "PPSPatientRegister" && (
                                    <TextField
                                        label={i18n.t("Search Patient")}
                                        helperText={i18n.t("Filter by patient id or code")}
                                        value={patientSearchKeyword}
                                        onChange={e => setPatientSearchKeyword(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                    />
                                )}
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
                    </>

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

                    {isPaginatedSurveyList(surveyFormType) ? (
                        <PaginatedSurveyListTable
                            surveys={searchResultSurveys}
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
            {isLoading && (
                <Backdrop open={true} style={{ color: "#fff", zIndex: 1 }}>
                    <CircularProgress color="inherit" size={50} />
                </Backdrop>
            )}
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
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
`;
