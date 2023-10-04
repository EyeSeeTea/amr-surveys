import { useConfig } from "@dhis2/app-runtime";
import i18n from "@eyeseetea/feedback-component/locales";
import { Box, Button, Typography } from "@material-ui/core";
import { CircularProgress, List } from "material-ui";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { palette } from "../../pages/app/themes/dhis2.theme";
import { CustomCard } from "../custom-card/CustomCard";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import LeftNavMenu from "./LeftNavMenu";
import LeftNavMenuGroup from "./LeftNavMenuGroup";

export interface MenuGroup {
    kind: "MenuGroup";
    level: number;
    title: string;
    moduleColor: string;
    icon?: string;
    children?: Menu[];
}

export interface MenuLeaf {
    kind: "MenuLeaf";
    level: number;
    title: string;
    path: string;
    icon?: any;
}

export type Menu = MenuGroup | MenuLeaf;

export const LeftNav: React.FC = () => {
    const { baseUrl } = useConfig();
    const [storedMenuData, setStoredMenuData] = useState<Menu[] | null>();

    const logout = () => {
        window.location = [
            baseUrl.replace(/\/$/, ""),
            "/dhis-web-commons-security/logout.action".replace(/^\//, ""),
        ].join("/") as unknown as Location;
    };

    useEffect(() => {
        const menuData: Menu[] = [
            {
                kind: "MenuGroup",
                level: 0,
                title: "Module1",
                moduleColor: "red",
                icon: "folder",
                children: [
                    {
                        kind: "MenuLeaf",
                        level: 0,
                        title: "Surveys",
                        path: `/surveys`,
                    },
                ],
            },
            {
                kind: "MenuGroup",
                level: 0,
                title: "Module2",
                moduleColor: "pink",
                icon: "folder",
                children: [
                    {
                        kind: "MenuLeaf",
                        level: 0,
                        title: "Surveys",
                        path: `/surveys`,
                    },
                ],
            },
        ];
        setStoredMenuData(menuData);
    }, [setStoredMenuData]);

    return (
        <LeftNavContainer>
            <CustomCard minheight="600px" padding="0 0 80px 0" maxwidth="250px">
                <HomeButtonWrapper>
                    <Button
                        className="home-button"
                        component={NavLink}
                        to="/"
                        exact={true}
                        // onClick={updateModuleAndPeriodContext}
                    >
                        <StarGradient className="star-icon" />
                        <Box width={15} />
                        <Typography>{i18n.t("HOME")}</Typography>
                    </Button>
                </HomeButtonWrapper>
                {storedMenuData && (
                    <List>
                        {storedMenuData.map(menu =>
                            menu.kind === "MenuGroup" ? (
                                <LeftNavMenuGroup
                                    menu={menu}
                                    key={menu.title}
                                    groupName={menu.title}
                                />
                            ) : (
                                <LeftNavMenu menu={menu} key={menu.title} />
                            )
                        )}
                    </List>
                )}

                {/* <Backdrop open={isLoading} style={{ color: "#fff", zIndex: 1 }}>
                    <StyledCircularProgress color="inherit" size={30} />
                </Backdrop> */}

                <div style={{ flexGrow: 1 }} />
            </CustomCard>
            <ButtonContainer>
                <div>
                    <StyledButton
                        onClick={logout}
                        variant="contained"
                        color="default"
                        startIcon={<ExitToAppIcon />}
                        disableElevation
                    >
                        {i18n.t("Log Out")}
                    </StyledButton>
                </div>
            </ButtonContainer>
        </LeftNavContainer>
    );
};
const LeftNavContainer = styled.div`
    height: 100%;
`;
const HomeButtonWrapper = styled.div`
    margin: 25px 0 0 0;
    .home-button {
        border-radius: 0;
        display: flex;
        flex-direction: row;
        text-transform: uppercase;
        cursor: pointer;
        justify-content: flex-start;
        padding: 10px 25px;
        margin: 0;
        &:hover {
            background: ${palette.primary.main} !important;
            color: white;
            .star-icon {
                background: white;
            }
        }
    }
`;

const StarGradient = styled.div`
    width: 23px;
    height: 23px;
    clip-path: polygon(
        50% 0%,
        61% 35%,
        98% 35%,
        68% 57%,
        79% 91%,
        50% 70%,
        21% 91%,
        32% 57%,
        2% 35%,
        39% 35%
    );
    background: ${palette.primary.main};
`;

export const StyledCircularProgress = styled(CircularProgress)`
    margin: 30px auto;
    size: 20;
`;

const ButtonContainer = styled.div`
    position: relative;
    top: -70px;
    width: 100%;
    display: block;
    z-index: 2;
    text-align: center;
    > div {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
`;

const StyledButton = styled(Button)`
    margin: 16px;
    background: transparent;
    text-transform: none;
`;
