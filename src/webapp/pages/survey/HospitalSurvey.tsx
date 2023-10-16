import React from "react";
import styled from "styled-components";
import { SurveyList } from "../../components/survey/SurveyList";

export const HospitalSurvey: React.FC = React.memo(() => {
    return (
        <ContentWrapper>
            <SurveyList type="HospitalSurvey" />
        </ContentWrapper>
    );
});

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
