import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { SurveyList } from "../../components/survey-list/SurveyList";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { SurveyListBreadCrumb } from "../../components/survey-list/SurveyListBreadCrumb";

export const SurveyListPage: React.FC = React.memo(() => {
    const { formType } = useParams<{ formType: SURVEY_FORM_TYPES }>();
    const { changeCurrentPPSSurveyForm } = useCurrentSurveys();

    useEffect(() => {
        if (formType === "PPSSurveyForm") changeCurrentPPSSurveyForm(undefined);
    }, [formType, changeCurrentPPSSurveyForm]);

    return (
        <ContentWrapper>
            <SurveyListBreadCrumb formType={formType} />
            <SurveyList surveyFormType={formType} />
        </ContentWrapper>
    );
});

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
