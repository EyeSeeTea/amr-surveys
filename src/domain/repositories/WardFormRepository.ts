import { FutureData } from "../../data/api-futures";
import { WardEventDetails } from "../entities/Questionnaire/WardEvent";
import { FormValue, WardForm } from "../entities/Questionnaire/WardForm";
import { WardStatisticsFormType } from "../entities/Survey";
import { Id } from "../entities/Ref";

export interface WardFormRepository {
    get(
        facilityId: Id,
        period: string,
        wardEvents: WardEventDetails[],
        wardFormType: WardStatisticsFormType
    ): FutureData<WardForm[]>;
    save(
        formValue: FormValue,
        facilityId: Id,
        period: string,
        wardFormType: WardStatisticsFormType
    ): FutureData<void>;
}
