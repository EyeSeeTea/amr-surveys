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
import { SurveyListTable } from "./table/SurveyListTable";
import { SurveyListFilters } from "./SurveyListFilters";
import _ from "../../../domain/entities/generic/Collection";
import { useFilteredSurveys } from "./hook/useFilteredSurveys";
import { PaginatedSurveyListTable } from "./table/PaginatedSurveyListTable";
import { usePatientSearch } from "./hook/usePatientSearch";
import useReadOnlyAccess from "../survey/hook/useReadOnlyAccess";
import useCaptureAccess from "../survey/hook/useCaptureAccess";
import useHasAdminAccess from "../survey/hook/useHasAdminAccess";

interface SurveyListProps {
    surveyFormType: SURVEY_FORM_TYPES;
}
export const SurveyList: React.FC<SurveyListProps> = ({ surveyFormType }) => {
    const { currentPPSSurveyForm } = useCurrentSurveys();
    const { hasReadOnlyAccess: hasOnlyReadAccess } = useReadOnlyAccess();
    const { hasCaptureAccess } = useCaptureAccess();
    const { hasAdminAccess } = useHasAdminAccess();

    const {
        surveys,
        loadingSurveys,
        errorSurveys,
        page,
        setPage,
        pageSize,
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
    } = useFilteredSurveys(surveyFormType, hasAdminAccess, surveys);

    const {
        searchResultSurveys,
        patientIdSearchKeyword,
        setPatientIdSearchKeyword,
        handlePatientIdSearch,
        patientCodeSearchKeyword,
        setPatientCodeSearchKeyword,
        handlePatientCodeSearch,
        isLoading,
    } = usePatientSearch(filteredSurveys, surveyFormType, page, setTotal);

    return (
        <ContentWrapper>
            <ContentLoader loading={loadingSurveys} error={errorSurveys} showErrorAsSnackbar={true}>
                <CustomCard padding="20px 30px 20px">
                    {/* Hospital data entry users cannot create new hospital surveys. They can only view the hospital survey list */}
                    <>
                        {!hideCreateNewButton(
                            surveyFormType,
                            hasAdminAccess,
                            hasOnlyReadAccess,
                            hasCaptureAccess,
                            currentPPSSurveyForm?.surveyType
                                ? currentPPSSurveyForm?.surveyType
                                : "",
                            surveys
                        ) && (
                            <ButtonWrapper>
                                {surveyFormType === "PPSPatientRegister" && (
                                    <>
                                        <TextField
                                            label={i18n.t("Search Patient ID")}
                                            helperText={i18n.t("Filter by patient id")}
                                            value={patientIdSearchKeyword}
                                            onChange={e =>
                                                setPatientIdSearchKeyword(e.target.value)
                                            }
                                            onKeyDown={handlePatientIdSearch}
                                        />
                                        <TextField
                                            label={i18n.t("Search Patient Code")}
                                            helperText={i18n.t("Filter by patientcode")}
                                            value={patientCodeSearchKeyword}
                                            onChange={e =>
                                                setPatientCodeSearchKeyword(e.target.value)
                                            }
                                            onKeyDown={handlePatientCodeSearch}
                                        />
                                    </>
                                )}
                                {surveyFormType === "PrevalenceCaseReportForm" && (
                                    <>
                                        <TextField
                                            label={i18n.t("Search Patient ID")}
                                            helperText={i18n.t("Filter by patient id")}
                                            value={patientIdSearchKeyword}
                                            onChange={e =>
                                                setPatientIdSearchKeyword(e.target.value)
                                            }
                                            onKeyDown={handlePatientIdSearch}
                                        />
                                    </>
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

                    {surveyFormType === "PrevalenceSurveyForm" && (
                        <SurveyListFilters status={statusFilter} setStatus={setStatusFilter} />
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
