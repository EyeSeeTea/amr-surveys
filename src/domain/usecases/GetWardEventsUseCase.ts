import { WardStatisticsFormType } from "../entities/Survey";
import { OrgUnitAccess } from "../entities/User";
import { WardEventRepository } from "../repositories/WardEventRepository";

export class GetWardEventsUseCase {
    constructor(private wardEventRepository: WardEventRepository) {}

    public execute(orgUnit: OrgUnitAccess, wardFormType: WardStatisticsFormType) {
        return this.wardEventRepository.get(orgUnit, wardFormType);
    }
}
