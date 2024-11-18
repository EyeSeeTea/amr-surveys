import { FutureData } from "../../data/api-futures";
import { NamedRef } from "../entities/Ref";
import { OrgUnitAccess, User } from "../entities/User";

export interface UserRepository {
    getCurrent(): FutureData<User>;
    savePassword(password: string): FutureData<string>;
    saveLocale(isUiLocale: boolean, locale: string): FutureData<void>;
    getPrevalenceAccessibleHospitals(
        organisationUnits: NamedRef[],
        dataViewOrganisationUnits: NamedRef[]
    ): FutureData<OrgUnitAccess[]>;
    getPPSAccessibleHospitals(
        organisationUnits: NamedRef[],
        dataViewOrganisationUnits: NamedRef[]
    ): FutureData<OrgUnitAccess[]>;
}
