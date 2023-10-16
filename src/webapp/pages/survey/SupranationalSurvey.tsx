import React from "react";
import styled from "styled-components";
import { SurveyList } from "../../components/survey/SurveyList";

export const SupranationalSurvey: React.FC = React.memo(() => {
    return (
        <ContentWrapper>
            <SurveyList type="SupranationalSurvey" />
        </ContentWrapper>
    );
});

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
