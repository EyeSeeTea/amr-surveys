import React from "react";
import { HashRouter, Route, Switch } from "react-router-dom";
import { MainLayout } from "../components/main-layout/MainLayout";
import { CurrentSurveysContextProvider } from "../contexts/CurrentSurveysContextProvider";
import { SurveyPage } from "./survey/SurveyPage";
import { LandingPage } from "./landing/LandingPage";
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
                    <Route
                        path="/surveys/:formType"
                        render={() => (
                            <CurrentSurveysContextProvider>
                                <SurveyListPage />
                            </CurrentSurveysContextProvider>
                        )}
                    />
                    <Route
                        path="/new-survey/:formType"
                        render={() => (
                            <CurrentSurveysContextProvider>
                                <SurveyPage />
                            </CurrentSurveysContextProvider>
                        )}
                    />
                    <Route
                        path="/survey/:formType/:id"
                        render={() => (
                            <CurrentSurveysContextProvider>
                                <SurveyPage />
                            </CurrentSurveysContextProvider>
                        )}
                    />
                    {/* Default route */}
                    <Route render={() => <LandingPage />} />
                </Switch>
            </MainLayout>
        </HashRouter>
    );
}
