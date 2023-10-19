import React from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { SurveyForm } from "../../components/survey/SurveyForm";

export const NewSurveyPage: React.FC = () => {
    const history = useHistory();

    const hideForm = () => {
        history.push(`/surveys`);
    };

    return (
        <ContentWrapper>
            <SurveyForm hideForm={hideForm} formType="PPSSurveyForm" />
        </ContentWrapper>
    );
};

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
