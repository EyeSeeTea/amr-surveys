import React from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { SurveyList } from "../../components/survey-list/SurveyList";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";

export const SurveyListPage: React.FC = React.memo(() => {
    const { type } = useParams<{ type: SURVEY_FORM_TYPES }>();
    const { changeCurrentPPSSurveyForm } = useCurrentSurveys();

    if (type === "PPSSurveyForm") changeCurrentPPSSurveyForm(undefined); //TO DO : Can we set this on menu click of surveys

    return (
        <ContentWrapper>
            <SurveyList surveyType={type} />
        </ContentWrapper>
    );
});

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
