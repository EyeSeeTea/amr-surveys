import React from "react";
import { HashRouter, Route, Switch } from "react-router-dom";
import { MainLayout } from "../components/main-layout/MainLayout";
import { LandingPage } from "./landing/LandingPage";
import { HospitalSurvey } from "./survey/HospitalSurvey";
import { NationalSurvey } from "./survey/NationalSurvey";
import { SupranationalSurvey } from "./survey/SupranationalSurvey";
import { UserProfilePage } from "./user-profile/UserProfilePage";
import { UserSettingsPage } from "./user-profile/UserSettings";

export function Router() {
    return (
        <HashRouter>
            <MainLayout>
                <Switch>
                    <Route path="/user-profile" render={() => <UserProfilePage />} />
                    <Route path="/user-settings" render={() => <UserSettingsPage />} />
                    <Route path="/hospital-survey" render={() => <HospitalSurvey />} />
                    <Route path="/national-survey" render={() => <NationalSurvey />} />
                    <Route path="/supranational-survey" render={() => <SupranationalSurvey />} />
                    {/* Default route */}
                    <Route render={() => <LandingPage />} />
                </Switch>
            </MainLayout>
        </HashRouter>
    );
}
