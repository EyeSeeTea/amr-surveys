import React from "react";
import { HashRouter, Route, Switch } from "react-router-dom";
import { MainLayout } from "../components/main-layout/MainLayout";
import { SurveyPage } from "./edit-survey/SurveyPage";
import { LandingPage } from "./landing/LandingPage";
import { NewSurveyPage } from "./new-survey/NewSurveyPage";
import { SurveyListPage } from "./survey-list/SurveyListPage";

import { UserProfilePage } from "./user-profile/UserProfilePage";
import { UserSettingsPage } from "./user-profile/UserSettings";

export function Router() {
    return (
        <HashRouter>
            <MainLayout>
                <Switch>
                    <Route path="/user-profile" render={() => <UserProfilePage />} />
                    <Route path="/user-settings" render={() => <UserSettingsPage />} />
                    <Route path="/surveys" render={() => <SurveyListPage />} />
                    <Route path="/new-survey" render={() => <NewSurveyPage />} />
                    <Route path="/survey/:id" render={() => <SurveyPage />} />

                    {/* Default route */}
                    <Route render={() => <LandingPage />} />
                </Switch>
            </MainLayout>
        </HashRouter>
    );
}
