import React from "react";
import { useHistory, useParams } from "react-router-dom";
import styled from "styled-components";

import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { SurveyForm } from "../../components/survey/SurveyForm";
import { SurveyFormBreadCrumb } from "../../components/survey/SurveyFormBreadCrumb";

export const SurveyPage: React.FC = () => {
    const { formType, id } = useParams<{ formType: SURVEY_FORM_TYPES; id: string }>();
    const history = useHistory();

    const hideForm = () => {
        history.push(`/surveys/${formType}`);
    };

    return (
        <ContentWrapper>
            <SurveyFormBreadCrumb formType={formType} id={id} />
            <SurveyForm hideForm={hideForm} formType={formType} currentSurveyId={id} />
        </ContentWrapper>
    );
};

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
