import React, { useEffect, useState } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import styled from "styled-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { SurveyForm } from "../../components/survey/SurveyForm";

export const SurveyPage: React.FC = () => {
    const { type, id } = useParams<{ type: SURVEY_FORM_TYPES; id: string }>();
    const history = useHistory();
    const [parentSurveyId, setParentSurveyId] = useState<string | undefined>();
    const location = useLocation<{ parentSurveyId: string }>();

    useEffect(() => {
        const parentSurveyIdL = location.state?.parentSurveyId;
        if (parentSurveyIdL) setParentSurveyId(parentSurveyIdL);
    }, [setParentSurveyId, location.state?.parentSurveyId]);

    const hideForm = () => {
        if (parentSurveyId)
            history.push({
                pathname: `/surveys/${type}`,
                state: { parentSurveyId: parentSurveyId },
            });
        else history.push(`/surveys/${type}`);
    };

    return (
        <ContentWrapper>
            <SurveyForm hideForm={hideForm} formType={type} surveyId={id} />
        </ContentWrapper>
    );
};

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
