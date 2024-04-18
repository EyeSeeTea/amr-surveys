import { D2Api } from "@eyeseetea/d2-api/2.36";
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
import { HospitalContext, HospitalContextState } from "../../contexts/hospital-context";
import {
    ASTGuidelinesContext,
    ASTGuidelinesContextState,
} from "../../contexts/ast-guidelines-context";

export interface AppProps {
    compositionRoot: CompositionRoot;
    api?: D2Api;
}

function App(props: AppProps) {
    const { compositionRoot, api } = props;
    const [showShareButton, setShowShareButton] = useState(false);
    const [loading, setLoading] = useState(true);
    const [appContext, setAppContext] = useState<AppContextState | null>(null);
    const [hospitalContext, setHospitalContext] = useState<HospitalContextState | null>(null);
    const [astGuidelinesContext, setAstGuidelinesContext] =
        useState<ASTGuidelinesContextState | null>(null);

    useEffect(() => {
        async function setup() {
            const isShareButtonVisible = appConfig.appearance.showShareButton;
            const currentUser = await compositionRoot.users.getCurrent.execute().toPromise();
            if (!currentUser) throw new Error("User not logged in");

            setAppContext({ currentUser, compositionRoot, api });
            //set some default value for hospital,astguidelines context until its loaded.
            setHospitalContext({ userHospitalsAccess: [] });
            setAstGuidelinesContext({
                CLSI_lists: new Map(),
                CLSI_matrix: new Map(),
                EUCAST_lists: new Map(),
                EUCAST_matrix: new Map(),
            });

            setShowShareButton(isShareButtonVisible);

            compositionRoot.users.getAccessibleOUByLevel
                .execute(currentUser.organisationUnits, currentUser.dataViewOrganisationUnits)
                .run(
                    hospitalData => {
                        setHospitalContext({ userHospitalsAccess: hospitalData });
                        console.debug("Hospital data fetched successfully, hospital data set");
                    },
                    err => {
                        console.debug(` No hospital data could be fetched : ${err}`);
                    }
                );

            compositionRoot.astGuidelines.getGuidelines.execute().run(
                astGuidelines => {
                    setAstGuidelinesContext(astGuidelines);
                    console.debug(
                        "AST Guidelines data fetched successfully, AST guidelines data set"
                    );
                },
                err => {
                    console.debug(` No AST guidelines data could be fetched : ${err}`);
                }
            );

            setLoading(false);
        }
        setup();
    }, [compositionRoot, api]);

    if (loading) return null;

    return (
        <MuiThemeProvider theme={muiTheme}>
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
                            <HospitalContext.Provider value={hospitalContext}>
                                <ASTGuidelinesContext.Provider value={astGuidelinesContext}>
                                    <CurrentModuleContextProvider>
                                        <Router />
                                    </CurrentModuleContextProvider>
                                </ASTGuidelinesContext.Provider>
                            </HospitalContext.Provider>
                        </AppContext.Provider>
                    </div>

                    <Share visible={showShareButton} />
                </SnackbarProvider>
            </OldMuiThemeProvider>
        </MuiThemeProvider>
    );
}

export default React.memo(App);
