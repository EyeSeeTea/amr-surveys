import React from "react";
import { useHistory, useParams } from "react-router-dom";
import styled from "styled-components";

import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { SurveyForm } from "../../components/survey/SurveyForm";
import { SurveyFormBreadCrumb } from "../../components/survey/SurveyFormBreadCrumb";

export const SurveyPage: React.FC = () => {
    const { type, id } = useParams<{ type: SURVEY_FORM_TYPES; id: string }>();
    const history = useHistory();

    const hideForm = () => {
        history.push(`/surveys/${type}`);
    };

    return (
        <ContentWrapper>
            <SurveyFormBreadCrumb type={type} id={id} />
            <SurveyForm hideForm={hideForm} formType={type} currentSurveyId={id} />
        </ContentWrapper>
    );
};

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
