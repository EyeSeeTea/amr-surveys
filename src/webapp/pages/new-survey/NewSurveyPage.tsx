import React from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { NewSurveyForm } from "../../components/new-survey/NewSurveyForm";

export const NewSurveyPage: React.FC = () => {
    const history = useHistory();

    const hideForm = () => {
        history.push(`/surveys`);
    };

    return (
        <ContentWrapper>
            <NewSurveyForm hideForm={hideForm} />
        </ContentWrapper>
    );
};

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
