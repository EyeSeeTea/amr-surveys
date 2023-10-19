import React from "react";
import styled from "styled-components";
import { SurveyList } from "../../components/survey-list/SurveyList";

export const SurveyListPage: React.FC = React.memo(() => {
    return (
        <ContentWrapper>
            <SurveyList />
        </ContentWrapper>
    );
});

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
