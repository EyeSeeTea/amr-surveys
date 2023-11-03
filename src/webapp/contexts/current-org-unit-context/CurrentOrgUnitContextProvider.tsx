import { PropsWithChildren, useCallback, useState } from "react";
import { OrgUnitAccess } from "../../../domain/entities/User";
import { useAppContext } from "../app-context";
import { CurrentOrgUnitContext, defaultOrgUnitContextState } from "./current-orgUnit-context";

export const CurrentOrgUnitContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const { currentUser } = useAppContext();

    const [currentOrgUnitAccess, setCurrentOrgUnitAccess] = useState<OrgUnitAccess>(
        defaultOrgUnitContextState.currentOrgUnitAccess
    );

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

    //Reset to default, i.e: Global
    const resetOrgUnit = useCallback(() => {
        setCurrentOrgUnitAccess(defaultOrgUnitContextState.currentOrgUnitAccess);
    }, []);

    return (
        <CurrentOrgUnitContext.Provider
            value={{
                currentOrgUnitAccess,
                changeCurrentOrgUnitAccess,
                resetOrgUnit,
            }}
        >
            {children}
        </CurrentOrgUnitContext.Provider>
    );
};
