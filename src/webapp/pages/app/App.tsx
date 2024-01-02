import { D2Api } from "@eyeseetea/d2-api/2.36";
import { SnackbarProvider } from "@eyeseetea/d2-ui-components";
import { Feedback } from "@eyeseetea/feedback-component";
import { MuiThemeProvider } from "@material-ui/core/styles";
//@ts-ignore
import OldMuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import React, { useEffect, useMemo, useState } from "react";
import { appConfig } from "../../../app-config";
import { CompositionRoot } from "../../../CompositionRoot";
import Share from "../../components/share/Share";
import { AppContext, AppContextState } from "../../contexts/app-context";
import { CurrentModuleContextProvider } from "../../contexts/CurrentModuleContextProvider";
import { Router } from "../Router";
import "./App.css";
import muiThemeLegacy from "./themes/dhis2-legacy.theme";
import { muiTheme } from "./themes/dhis2.theme";
import { User } from "../../../domain/entities/User";

export interface AppProps {
    compositionRoot: CompositionRoot;
    api?: D2Api;
}

function App(props: AppProps) {
    const { compositionRoot, api } = props;
    const [showShareButton, setShowShareButton] = useState(false);
    const [loading, setLoading] = useState(true);
    const [appContext, setAppContext] = useState<AppContextState | null>(null);

    const hospitalWorker: Worker = useMemo(
        () => new Worker(new URL("../../../workers/getHospitalWorker", import.meta.url)),
        []
    );

    useEffect(() => {
        async function setup() {
            const isShareButtonVisible = appConfig.appearance.showShareButton;
            const currentUser = await compositionRoot.users.getCurrent.execute().toPromise();
            if (!currentUser) throw new Error("User not logged in");

            setAppContext({ currentUser, compositionRoot, api });
            setShowShareButton(isShareButtonVisible);

            const userOrgUnits = currentUser.organisationUnits;
            const userDataViewOrgUnits = currentUser.dataViewOrganisationUnits;
            if (api && userOrgUnits && userDataViewOrgUnits) {
                const dataForHospitalWorker = { api, userOrgUnits, userDataViewOrgUnits };
                hospitalWorker.postMessage(dataForHospitalWorker);
            }

            hospitalWorker.onmessage = e => {
                if (e.data) {
                    const updatedCurrentUser: User = new User({
                        ...currentUser,
                        userHospitalsAccess: e.data.hospitalOrgUnitAccess,
                    });
                    setAppContext({ currentUser: updatedCurrentUser, compositionRoot, api });
                    console.debug("Hospital worker completed, hospital data set");
                } else console.debug("An error occured : No data fetched by hospital worker");
            };

            setLoading(false);
        }
        setup();
    }, [compositionRoot, api, hospitalWorker]);

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
                            <CurrentModuleContextProvider>
                                <Router />
                            </CurrentModuleContextProvider>
                        </AppContext.Provider>
                    </div>

                    <Share visible={showShareButton} />
                </SnackbarProvider>
            </OldMuiThemeProvider>
        </MuiThemeProvider>
    );
}

export default React.memo(App);
