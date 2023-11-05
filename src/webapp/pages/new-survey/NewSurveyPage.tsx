import { CircularProgress } from "material-ui";
import React, { useEffect, useState } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import styled from "styled-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { SurveyForm } from "../../components/survey/SurveyForm";



export const NewSurveyPage: React.FC = () => {
    const { type } = useParams<{ type: SURVEY_FORM_TYPES }>();
    const [parentSurveyId, setParentSurveyId] = useState<string | undefined>();
    const history = useHistory();
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

    //Do not load any children forms until parent Id is set
    if (!parentSurveyId && type === "PPSCountryQuestionnaire") {
        return <CircularProgress></CircularProgress>;
    }

    return (
        <ContentWrapper>
            <SurveyForm hideForm={hideForm} formType={type} parentSurveyId={parentSurveyId} />
        </ContentWrapper>
    );
};

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
