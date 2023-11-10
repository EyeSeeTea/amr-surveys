import React, { PropsWithChildren } from "react";
import { Box, Typography } from "@material-ui/core";
import { Paper } from "material-ui";
import styled from "styled-components";
import i18n from "@eyeseetea/d2-ui-components/locales";
import { palette } from "../../pages/app/themes/dhis2.theme";

interface CustomCardProps {
    minheight?: string;
    maxwidth?: string;
    height?: string;
    padding?: string;
    title?: string;
}

export const CustomCard: React.FC<PropsWithChildren<CustomCardProps>> = ({
    minheight,
    padding,
    children,
    height = "auto",
    title,
    maxwidth,
}) => {
    return (
        <StyleCard minheight={minheight} padding={padding} height={height} maxwidth={maxwidth}>
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
                height={"100%"}
            >
                {title && (
                    <TitleContainer>
                        <Typography variant="h5">{i18n.t(title)}</Typography>
                    </TitleContainer>
                )}
                {children}
            </Box>
        </StyleCard>
    );
};

export const StyleCard = styled(Paper)<CustomCardProps>`
    border-radius: 20px !important;
    min-height: ${props => props.minheight};
    max-width: ${props => props.maxwidth};
    height: ${props => props.height};
    padding: ${props => props.padding};
    overflow: hidden;
`;

const TitleContainer = styled.div`
    background: ${palette.primary.main};
    color: white;
    border-radius: 20px 20px 0px 0px;
    padding: 14px 34px;
`;
