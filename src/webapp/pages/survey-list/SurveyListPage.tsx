import React, { useCallback, useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import styled from "styled-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { SurveyList } from "../../components/survey-list/SurveyList";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { SurveyListBreadCrumb } from "../../components/survey-list/SurveyListBreadCrumb";
import { useCurrentModule } from "../../contexts/current-module-context";

export const SurveyListPage: React.FC = React.memo(() => {
    const { formType } = useParams<{ formType: SURVEY_FORM_TYPES }>();
    const {
        currentPPSSurveyForm,
        currentPrevalenceSurveyForm,
        currentCountryQuestionnaire,
        currentHospitalForm,
        currentWardRegister,
        currentFacilityLevelForm,
        currentCaseReportForm,
        resetCurrentPPSSurveyForm,
        resetCurrentPrevalenceSurveyForm,
    } = useCurrentSurveys();

    const { currentModule } = useCurrentModule();
    const history = useHistory();

    const shouldRedirectToHome = useCallback(
        (formType: SURVEY_FORM_TYPES): boolean => {
            if (
                (formType === "PPSCountryQuestionnaire" && !currentPPSSurveyForm) ||
                (formType === "PPSHospitalForm" && !currentCountryQuestionnaire) ||
                (formType === "PPSWardRegister" && !currentHospitalForm) ||
                (formType === "PPSPatientRegister" && !currentWardRegister) ||
                (formType === "PrevalenceFacilityLevelForm" && !currentPrevalenceSurveyForm) ||
                (formType === "PrevalenceCaseReportForm" && !currentFacilityLevelForm) ||
                ((formType === "PrevalenceCentralRefLabForm" ||
                    formType === "PrevalencePathogenIsolatesLog" ||
                    formType === "PrevalenceSampleShipTrackForm" ||
                    formType === "PrevalenceSupranationalRefLabForm") &&
                    !currentCaseReportForm)
            )
                return true;
            else return false;
        },
        [
            currentPPSSurveyForm,
            currentPrevalenceSurveyForm,
            currentCountryQuestionnaire,
            currentHospitalForm,
            currentWardRegister,
            currentFacilityLevelForm,
            currentCaseReportForm,
        ]
    );

    //reset all current survey context when root form of either module is listed.
    useEffect(() => {
        if (formType === "PPSSurveyForm" || formType === "PrevalenceSurveyForm") {
            resetCurrentPPSSurveyForm();
            resetCurrentPrevalenceSurveyForm();
        } else if (shouldRedirectToHome(formType)) {
            //Redirecting to home page.
            history.push("/");
        }
    }, [
        formType,
        history,
        resetCurrentPPSSurveyForm,
        resetCurrentPrevalenceSurveyForm,
        shouldRedirectToHome,
    ]);

    return (
        <ContentWrapper>
            {currentModule?.name === "PPS" && <SurveyListBreadCrumb formType={formType} />}
            <SurveyList surveyFormType={formType} />
        </ContentWrapper>
    );
});

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
