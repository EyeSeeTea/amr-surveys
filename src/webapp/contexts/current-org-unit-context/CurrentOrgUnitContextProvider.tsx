import { PropsWithChildren, useCallback, useState } from "react";
import { OrgUnitAccess } from "../../../domain/entities/User";
import { useAppContext } from "../app-context";
import { CurrentOrgUnitContext, defaultOrgUnitContextState } from "./current-orgUnit-context";

export const CurrentOrgUnitContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const { currentUser } = useAppContext();

    //Set default org unit to the first org unit in list
    const defaultOrgUnit: OrgUnitAccess = currentUser.userOrgUnitsAccess[0]
        ? currentUser.userOrgUnitsAccess[0]
        : defaultOrgUnitContextState.currentOrgUnitAccess;
    const [currentOrgUnitAccess, setCurrentOrgUnitAccess] = useState<OrgUnitAccess>(defaultOrgUnit);

    const changeCurrentOrgUnitAccess = useCallback(
        (updatedOrgUnit: string) => {
            const currentOrgUnitAccess = currentUser.userOrgUnitsAccess.find(
                ou => ou.orgUnitId === updatedOrgUnit
            );
            if (currentOrgUnitAccess) {
                setCurrentOrgUnitAccess(currentOrgUnitAccess);
                
            }
        },
        [currentUser.userOrgUnitsAccess]
    );

    return (
        <CurrentOrgUnitContext.Provider
            value={{
                currentOrgUnitAccess,
                changeCurrentOrgUnitAccess,
            }}
        >
            {children}
        </CurrentOrgUnitContext.Provider>
    );
};
