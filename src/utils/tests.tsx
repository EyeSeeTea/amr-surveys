import { render, RenderResult } from "@testing-library/react";
import { SnackbarProvider } from "@eyeseetea/d2-ui-components";
import { ReactNode } from "react";
import { AppContext, AppContextState } from "../webapp/contexts/app-context";
import { getTestCompositionRoot } from "../CompositionRoot";
import { createAdminUser, createNonAdminUser } from "../domain/entities/__tests__/userFixtures";

export function getAdminTestContext() {
    const context: AppContextState = {
        currentUser: createAdminUser(),
        compositionRoot: getTestCompositionRoot(),
        prevalenceHospitals: [],
        ppsHospitals: [],
    };

    return context;
}

export function getHospitalDataEntryTestContext() {
    const context: AppContextState = {
        currentUser: createNonAdminUser(),
        compositionRoot: getTestCompositionRoot(true),
        prevalenceHospitals: [],
        ppsHospitals: [],
    };

    return context;
}

export function getReactComponent(children: ReactNode): RenderResult {
    const context = getAdminTestContext();

    return render(
        <AppContext.Provider value={context}>
            <SnackbarProvider>{children}</SnackbarProvider>
        </AppContext.Provider>
    );
}
