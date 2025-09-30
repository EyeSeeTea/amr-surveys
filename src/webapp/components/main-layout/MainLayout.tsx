import { Grid } from "@material-ui/core";
import React, { PropsWithChildren, useState } from "react";
import styled from "styled-components";
import { AppFooter } from "../app-footer/AppFooter";
import { LeftNav } from "../left-nav/LeftNav";
import { TopAppBar } from "../top-app-bar/TopAppBar";

export const MainLayout: React.FC<PropsWithChildren> = ({ children }) => {
    const [showMenu, setShowMenu] = useState(true);
    window.matchMedia("(max-width: 1000px)").addEventListener("change", e => {
        if (e.matches) {
            setShowMenu(false);
        }
    });

    const toggleShowMenu = () => {
        setShowMenu(prevShowMenu => {
            return !prevShowMenu;
        });
    };

    return (
        <div>
            <div>
                <TopAppBar toggleShowMenu={toggleShowMenu} />
            </div>
            <LandingContainer>
                <Grid container spacing={6}>
                    <Grid
                        item
                        xs={12}
                        sm={4}
                        md={3}
                        lg={2}
                        style={{ display: showMenu ? "block" : "none" }}
                    >
                        <LeftNav />
                    </Grid>
                    <Grid
                        item
                        xs={12}
                        sm={showMenu ? 8 : 12}
                        md={showMenu ? 9 : 12}
                        lg={showMenu ? 10 : 12}
                        style={{
                            overflow: "auto",
                        }}
                    >
                        {children}
                        <AppFooter />
                    </Grid>
                </Grid>
            </LandingContainer>
        </div>
    );
};

const LandingContainer = styled.div`
    padding: 30px;
`;
