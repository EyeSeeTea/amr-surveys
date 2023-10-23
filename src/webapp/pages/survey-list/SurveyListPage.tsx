import { CircularProgress } from "material-ui";
import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import styled from "styled-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { SurveyList } from "../../components/survey-list/SurveyList";

export const SurveyListPage: React.FC = React.memo(() => {
    const { type } = useParams<{ type: SURVEY_FORM_TYPES }>();
    const [parentSurveyId, setParentSurveyId] = useState<string | undefined>();
    const location = useLocation<{ parentSurveyId: string }>();

    useEffect(() => {
        const parentSurveyIdL = location.state?.parentSurveyId;
        if (parentSurveyIdL) setParentSurveyId(parentSurveyIdL);
    }, [setParentSurveyId, location.state?.parentSurveyId]);

    //Do not load any children forms until parent Id is set
    if (!parentSurveyId && type === "PPSCountryQuestionnaire") {
        return <CircularProgress></CircularProgress>;
    }

    return (
        <ContentWrapper>
            <SurveyList surveyType={type} parentSurveyId={parentSurveyId} />
        </ContentWrapper>
    );
});

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
