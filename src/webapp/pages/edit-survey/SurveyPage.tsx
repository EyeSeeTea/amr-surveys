import React from "react";
import { useHistory, useParams } from "react-router-dom";
import styled from "styled-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { OrgUnitSelector } from "../../components/orgunit-selector/OrgUnitSelector";
import { SurveyForm } from "../../components/survey/SurveyForm";

export const SurveyPage: React.FC = () => {
    const { type, id } = useParams<{ type: SURVEY_FORM_TYPES; id: string }>();
    const history = useHistory();

    const hideForm = () => {
        history.push(`/surveys`);
    };

    return (
        <ContentWrapper>
            {type === "PPSCountryQuestionnaire" && <OrgUnitSelector />}
            <SurveyForm hideForm={hideForm} formType={type} surveyId={id} />
        </ContentWrapper>
    );
};

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
