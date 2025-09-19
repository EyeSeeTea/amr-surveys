import { Typography } from "@material-ui/core";
import React from "react";
import styled from "styled-components";

export const LandingPage: React.FC = React.memo(() => {
    return (
        <Container>
            <CenteredContent>
                <Typography variant="h6">Coming Soon! - AMR Surveys Landing Page</Typography>
            </CenteredContent>
        </Container>
    );
});

const Container = styled.div`
    height: 90vh;
`;

const CenteredContent = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
`;
