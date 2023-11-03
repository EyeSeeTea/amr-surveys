import { CircularProgress } from "material-ui";
import React, { useEffect, useState } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import styled from "styled-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { SurveyForm } from "../../components/survey/SurveyForm";
import { useCurrentOrgUnitContext } from "../../contexts/current-org-unit-context/current-orgUnit-context";
import { OrgUnitsSelector } from "@eyeseetea/d2-ui-components";
import { useAppContext } from "../../contexts/app-context";

export const NewSurveyPage: React.FC = () => {
    const { type } = useParams<{ type: SURVEY_FORM_TYPES }>();
    const { currentOrgUnitAccess, resetOrgUnit, changeCurrentOrgUnitAccess } =
        useCurrentOrgUnitContext();
    const [parentSurveyId, setParentSurveyId] = useState<string | undefined>();
    const { api } = useAppContext();

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
    const onOrgUnitChange = (orgUnitPaths: string[]) => {
        if (orgUnitPaths[0]) {
            const orgUnits = orgUnitPaths[0].split("/");
            const selectedCountry = orgUnits[orgUnits.length - 1];
            if (selectedCountry) changeCurrentOrgUnitAccess(selectedCountry);
        }
    };

    //Do not load any children forms until parent Id is set
    if (!parentSurveyId && type === "PPSCountryQuestionnaire") {
        return <CircularProgress></CircularProgress>;
    }

    return (
        <ContentWrapper>
            {type === "PPSCountryQuestionnaire" && (
                <OrgUnitsSelector
                    api={api}
                    fullWidth={false}
                    selected={[currentOrgUnitAccess.orgUnitPath]}
                    onChange={onOrgUnitChange}
                    singleSelection={true}
                    typeInput={"radio"}
                    hideMemberCount={true}
                    selectableLevels={[3]}
                    controls={{
                        filterByLevel: false,
                        filterByGroup: false,
                        filterByProgram: false,
                        selectAll: false,
                    }}
                />
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
