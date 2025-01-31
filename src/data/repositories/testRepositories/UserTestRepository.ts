import { OrgUnitAccess, User } from "../../../domain/entities/User";
import { createAdminUser } from "../../../domain/entities/__tests__/userFixtures";
import { Future } from "../../../domain/entities/generic/Future";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { FutureData } from "../../api-futures";
import { NamedRef } from "../../../domain/entities/Ref";

export class UserTestRepository implements UserRepository {
    getPPSAccessibleHospitals(
        _organisationUnits: NamedRef[],
        _dataViewOrganisationUnits: NamedRef[]
    ): FutureData<OrgUnitAccess[]> {
        return Future.success([]);
    }
    getPrevalenceAccessibleHospitals(
        _organisationUnits: NamedRef[],
        _dataViewOrganisationUnits: NamedRef[]
    ): FutureData<OrgUnitAccess[]> {
        return Future.success([]);
    }

    saveLocale(isUiLocale: boolean, locale: string): FutureData<void> {
        if (locale) return Future.success(undefined);
        else
            return Future.error({
                name: "ERR",
                message: `Error occurred on saving new locale settings: isUiLocale: ${isUiLocale}, locale: ${locale}`,
            });
    }
    public getCurrent(): FutureData<User> {
        return Future.success(createAdminUser());
    }

    public savePassword(password: string): FutureData<string> {
        if (password) return Future.success("OK");
        else return Future.error({ name: "ERR", message: "Error" });
    }
}
