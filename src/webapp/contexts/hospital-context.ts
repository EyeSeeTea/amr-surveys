import React, { useContext } from "react";
import { OrgUnitAccess } from "../../domain/entities/User";

export interface HospitalContextState {
    userHospitalsAccess: OrgUnitAccess[];
}

export const HospitalContext = React.createContext<HospitalContextState | null>(null);

export function useHospitalContext() {
    const context = useContext(HospitalContext);
    if (context) {
        return context;
    } else {
        throw new Error("Hospital context uninitialized");
    }
}
