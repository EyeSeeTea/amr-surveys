import { FutureData } from "../../data/api-futures";
import { FormValue } from "../entities/Questionnaire/WardForm";
import { WardStatisticsFormType } from "../entities/Survey";
import { Id } from "../entities/Ref";
import { WardFormRepository } from "../repositories/WardFormRepository";

export class SaveWardFormUseCase {
    constructor(private wardFormRepository: WardFormRepository) {}

    public execute(
        formValue: FormValue,
        facilityId: Id,
        period: string,
        wardFormType: WardStatisticsFormType
    ): FutureData<void> {
        return this.wardFormRepository.save(formValue, facilityId, period, wardFormType);
    }
}
