import { D2Api } from "../../types/d2-api";
import React, { useContext } from "react";
import { CompositionRoot } from "../../CompositionRoot";
import { OrgUnitAccess, User } from "../../domain/entities/User";

export interface AppContextState {
    currentUser: User;
    compositionRoot: CompositionRoot;
    api?: D2Api;
    ppsHospitals: OrgUnitAccess[];
    prevalenceHospitals: OrgUnitAccess[];
}

export const AppContext = React.createContext<AppContextState | null>(null);

export function useAppContext() {
    const context = useContext(AppContext);
    if (context) {
        return context;
    } else {
        throw new Error("App context uninitialized");
    }
}
