import { Typography } from "@material-ui/core";
import React from "react";
import styled from "styled-components";
import { useCurrentOrgUnitContext } from "../../contexts/current-org-unit-context/current-orgUnit-context";

export const LandingPage: React.FC = React.memo(() => {
    const { currentOrgUnitAccess } = useCurrentOrgUnitContext();
    return (
        <Container>
            <p>Current Org Unit (provided by context) : {currentOrgUnitAccess.orgUnitName}</p>
            <Typography variant="h6">Coming Soon! - AMR Surveys Landing Page</Typography>
        </Container>
    );
});

const Container = styled.div`
    padding: 300px;
`;
