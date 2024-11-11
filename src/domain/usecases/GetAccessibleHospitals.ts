import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { NamedRef } from "../entities/Ref";
import { OrgUnitAccess } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";

export class GetAccessibleHospitals {
    constructor(private usersRepository: UserRepository) {}

    public execute(
        organisationUnits: NamedRef[],
        dataViewOrganisationUnits: NamedRef[]
    ): FutureData<{ ppsHospitals: OrgUnitAccess[]; prevalenceHospitals: OrgUnitAccess[] }> {
        return Future.joinObj(
            {
                ppsHospitals: this.usersRepository.getPPSAccessibleHospitals(
                    organisationUnits,
                    dataViewOrganisationUnits
                ),
                prevalenceHospitals: this.usersRepository.getPrevalenceAccessibleHospitals(
                    organisationUnits,
                    dataViewOrganisationUnits
                ),
            },
            { concurrency: 2 }
        ).flatMap(({ ppsHospitals, prevalenceHospitals }) => {
            return Future.success({
                ppsHospitals: ppsHospitals,
                prevalenceHospitals: prevalenceHospitals,
            });
        });
    }
}
