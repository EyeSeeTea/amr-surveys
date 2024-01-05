import { FutureData } from "../../data/api-futures";
import { NamedRef } from "../entities/Ref";
import { OrgUnitAccess } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";

export class GetUserAccessibleOUByLevel {
    constructor(private usersRepository: UserRepository) {}

    public execute(
        organisationUnits: NamedRef[],
        dataViewOrganisationUnits: NamedRef[]
    ): FutureData<OrgUnitAccess[]> {


        
        return this.usersRepository.getCurrentOUByLevel(
            organisationUnits,
            dataViewOrganisationUnits
        );
    }
}
