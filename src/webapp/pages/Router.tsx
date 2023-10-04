import React from "react";
import { HashRouter, Route, Switch } from "react-router-dom";
import { MainLayout } from "../components/main-layout/MainLayout";
import { LandingPage } from "./landing/LandingPage";

export function Router() {
    return (
        <HashRouter>
            <MainLayout>
                <Switch>
                    {/* Default route */}
                    <Route render={() => <LandingPage />} />
                </Switch>
            </MainLayout>
        </HashRouter>
    );
}
