import React, { useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import styled from "styled-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { SurveyList } from "../../components/survey-list/SurveyList";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { SurveyListBreadCrumb } from "../../components/survey-list/SurveyListBreadCrumb";
import { useCurrentModule } from "../../contexts/current-module-context";
import { useRedirectHome } from "./useRedirectHome";
import { getUserAccess } from "../../../domain/utils/menuHelper";
import { useAppContext } from "../../contexts/app-context";

export const SurveyListPage: React.FC = React.memo(() => {
    const { formType } = useParams<{ formType: SURVEY_FORM_TYPES }>();
    const { resetCurrentPPSSurveyForm, resetCurrentPrevalenceSurveyForm } = useCurrentSurveys();

    const { currentModule } = useCurrentModule();
    const {
        currentUser: { userGroups },
    } = useAppContext();
    const { shouldRedirectToHome } = useRedirectHome();
    const history = useHistory();

    const isAdmin = currentModule ? getUserAccess(currentModule, userGroups).hasAdminAccess : false;

    //reset all current survey context when root form of either module is listed.
    useEffect(() => {
        if (
            formType === "PPSSurveyForm" ||
            formType === "PrevalenceSurveyForm" ||
            (!isAdmin &&
                (formType === "PrevalenceFacilityLevelForm" || formType === "PPSHospitalForm"))
        ) {
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
        isAdmin,
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
