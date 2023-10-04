import { Typography } from "@material-ui/core";
import React from "react";
import styled from "styled-components";

export const LandingPage: React.FC = React.memo(() => {
    return (
        <Container>
            <Typography variant="h6">Coming Soon! - AMR Surveys Landing Page</Typography>
        </Container>
    );
});

const Container = styled.div`
    padding: 300px;
`;
