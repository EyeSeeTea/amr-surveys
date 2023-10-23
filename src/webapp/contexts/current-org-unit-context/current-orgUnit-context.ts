import { createContext, useContext } from "react";
import { OrgUnitAccess } from "../../../domain/entities/User";

export interface CurrentOrgUnitContextState {
    currentOrgUnitAccess: OrgUnitAccess;
    changeCurrentOrgUnitAccess: (orgUnit: string) => void;
    resetOrgUnit: () => void;
}

export const defaultOrgUnitContextState = {
    currentOrgUnitAccess: {
        orgUnitId: "H8RixfF8ugH",
        orgUnitName: "Global",
        orgUnitShortName: "Global",
        orgUnitCode: "WHO-HQ",
        orgUnitPath: "/H8RixfF8ugH",
        readAccess: true,
        captureAccess: true,
    },
    changeCurrentOrgUnitAccess: () => {},
    resetOrgUnit: () => {},
};

export const CurrentOrgUnitContext = createContext<CurrentOrgUnitContextState>(
    defaultOrgUnitContextState
);

export function useCurrentOrgUnitContext() {
    const context = useContext(CurrentOrgUnitContext);
    if (context) {
        return context;
    } else {
        throw new Error("Current Org Unit Context uninitialized");
    }
}
