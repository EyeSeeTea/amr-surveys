import { FutureData } from "../../data/api-futures";
import { WardEvent } from "../entities/Questionnaire/WardEvent";
import { WardForm } from "../entities/Questionnaire/WardForm";
import { Id } from "../entities/Ref";
import { WardFormRepository } from "../repositories/WardFormRepository";

export class GetWardFormUseCase {
    constructor(private wardFormRepository: WardFormRepository) {}

    public execute(
        facilityId: Id,
        period: string,
        wardEvents: WardEvent[]
    ): FutureData<WardForm[]> {
        return this.wardFormRepository.get(facilityId, period, wardEvents);
    }
}
