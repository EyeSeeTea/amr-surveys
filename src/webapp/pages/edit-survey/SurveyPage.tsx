import React from "react";
import { useHistory, useParams } from "react-router-dom";
import styled from "styled-components";
import { SurveyForm } from "../../components/survey/SurveyForm";

export const SurveyPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const history = useHistory();

    const hideForm = () => {
        history.push(`/surveys`);
    };

    return (
        <ContentWrapper>
            <SurveyForm hideForm={hideForm} formType="PPSSurveyForm" surveyId={id} />
        </ContentWrapper>
    );
};

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
