import { CircularProgress } from "material-ui";
import React, { useEffect, useState } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import styled from "styled-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { OrgUnitSelector } from "../../components/orgunit-selector/OrgUnitSelector";
import { SurveyForm } from "../../components/survey/SurveyForm";
import { Typography } from "@material-ui/core";
import { useCurrentOrgUnitContext } from "../../contexts/current-org-unit-context/current-orgUnit-context";

export const NewSurveyPage: React.FC = () => {
    const { type } = useParams<{ type: SURVEY_FORM_TYPES }>();
    const { resetOrgUnit } = useCurrentOrgUnitContext();
    const [parentSurveyId, setParentSurveyId] = useState<string | undefined>();

    const history = useHistory();
    const location = useLocation<{ parentSurveyId: string }>();

    useEffect(() => {
        const parentSurveyIdL = location.state?.parentSurveyId;
        if (parentSurveyIdL) setParentSurveyId(parentSurveyIdL);

        return () => {
            //Clean up, set org unit ti default i.e Global
            resetOrgUnit();
        };
    }, [setParentSurveyId, location.state?.parentSurveyId, resetOrgUnit]);

    const hideForm = () => {
        history.push(`/surveys/${type}`);
    };

    //Do not load any children forms until parent Id is set
    if (!parentSurveyId && type === "PPSCountryQuestionnaire") {
        return <CircularProgress></CircularProgress>;
    }

    return (
        <ContentWrapper>
            {type === "PPSCountryQuestionnaire" && (
                <StyledOUContainer>
                    <Typography>Select Country</Typography>
                    <OrgUnitSelector />
                </StyledOUContainer>
            )}
            <SurveyForm hideForm={hideForm} formType={type} parentSurveyId={parentSurveyId} />
        </ContentWrapper>
    );
};

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const StyledOUContainer = styled.div`
    display: flex;
    gap: 10px;
    margin: 15px;
    align-items: center;
`;
