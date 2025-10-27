import { D2Api } from "../../../types/d2-api";
import { SnackbarProvider } from "@eyeseetea/d2-ui-components";
import { Feedback } from "@eyeseetea/feedback-component";
import { MuiThemeProvider } from "@material-ui/core/styles";
//@ts-ignore
import OldMuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import React, { useEffect, useState } from "react";
import { appConfig } from "../../../app-config";
import { CompositionRoot } from "../../../CompositionRoot";
import Share from "../../components/share/Share";
import { AppContext, AppContextState } from "../../contexts/app-context";
import { CurrentModuleContextProvider } from "../../contexts/CurrentModuleContextProvider";
import { Router } from "../Router";
import "./App.css";
import muiThemeLegacy from "./themes/dhis2-legacy.theme";
import { muiTheme } from "./themes/dhis2.theme";
import { ASTGuidelinesContextProvider } from "../../contexts/CurrentASTGuidelinesContextProvider";
import { ThemeProvider } from "styled-components";

export interface AppProps {
    compositionRoot: CompositionRoot;
    api?: D2Api;
}

function App(props: AppProps) {
    const { compositionRoot, api } = props;
    const [showShareButton, setShowShareButton] = useState(false);
    const [loading, setLoading] = useState(true);
    const [appContext, setAppContext] = useState<AppContextState | null>(null);

    useEffect(() => {
        async function setup() {
            const isShareButtonVisible = appConfig.appearance.showShareButton;
            const currentUser = await compositionRoot.users.getCurrent.execute().toPromise();
            if (!currentUser) throw new Error("User not logged in");
            const { prevalenceHospitals, ppsHospitals } =
                await compositionRoot.users.getAccessibleHospitals
                    .execute(currentUser.organisationUnits, currentUser.dataViewOrganisationUnits)
                    .toPromise();

            setAppContext({
                currentUser,
                compositionRoot,
                api,
                prevalenceHospitals: prevalenceHospitals,
                ppsHospitals: ppsHospitals,
            });

            setShowShareButton(isShareButtonVisible);

            setLoading(false);
        }
        setup();
    }, [compositionRoot, api]);

    if (loading) return null;

    return (
        <MuiThemeProvider theme={muiTheme}>
            <ThemeProvider theme={muiTheme}>
                <OldMuiThemeProvider muiTheme={muiThemeLegacy}>
                    <SnackbarProvider>
                        {appConfig.feedback && appContext && (
                            <Feedback
                                options={appConfig.feedback}
                                username={appContext.currentUser.username}
                            />
                        )}

                        <div id="app" className="content">
                            <AppContext.Provider value={appContext}>
                                <ASTGuidelinesContextProvider>
                                    <CurrentModuleContextProvider>
                                        <Router />
                                    </CurrentModuleContextProvider>
                                </ASTGuidelinesContextProvider>
                            </AppContext.Provider>
                        </div>

                        <Share visible={showShareButton} />
                    </SnackbarProvider>
                </OldMuiThemeProvider>
            </ThemeProvider>
        </MuiThemeProvider>
    );
}

export default React.memo(App);
