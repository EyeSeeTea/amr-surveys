import React from "react";
import { useHistory, useParams } from "react-router-dom";
import styled from "styled-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { SurveyForm } from "../../components/survey/SurveyForm";

export const NewSurveyPage: React.FC = () => {
    const { type } = useParams<{ type: SURVEY_FORM_TYPES }>();

    const history = useHistory();

    const hideForm = () => {
        history.push(`/surveys/${type}`);
    };

    return (
        <ContentWrapper>
            <SurveyForm hideForm={hideForm} formType={type} />
        </ContentWrapper>
    );
};

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
