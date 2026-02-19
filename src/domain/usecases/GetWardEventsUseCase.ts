import { Id } from "../entities/Ref";
import { WardEventRepository } from "../repositories/WardEventRepository";

export class GetWardEventsUseCase {
    constructor(private wardEventRepository: WardEventRepository) {}

    public execute(facilityId: Id) {
        return this.wardEventRepository.get(facilityId);
    }
}
