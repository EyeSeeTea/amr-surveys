import React from "react";
import { HashRouter, Route, Switch } from "react-router-dom";
import { MainLayout } from "../components/main-layout/MainLayout";
import { LandingPage } from "./landing/LandingPage";
import { UserProfilePage } from "./user-profile/UserProfilePage";
import { UserSettingsPage } from "./user-profile/UserSettings";

export function Router() {
    return (
        <HashRouter>
            <MainLayout>
                <Switch>
                    <Route path="/user-profile" render={() => <UserProfilePage />} />
                    <Route path="/user-settings" render={() => <UserSettingsPage />} />

                    {/* Default route */}
                    <Route render={() => <LandingPage />} />
                </Switch>
            </MainLayout>
        </HashRouter>
    );
}
