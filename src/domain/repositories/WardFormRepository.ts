import { FutureData } from "../../data/api-futures";
import { WardEventDetails } from "../entities/Questionnaire/WardEvent";
import { FormValue, WardForm } from "../entities/Questionnaire/WardForm";
import { Id } from "../entities/Ref";

export interface WardFormRepository {
    get(facilityId: Id, period: string, wardEvents: WardEventDetails[]): FutureData<WardForm[]>;
    save(formValue: FormValue, facilityId: Id, period: string): FutureData<void>;
}
