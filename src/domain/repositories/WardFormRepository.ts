import { FutureData } from "../../data/api-futures";
import { WardForm } from "../entities/Questionnaire/WardForm";
import { Id } from "../entities/Ref";

export interface WardFormRepository {
    get(facilityId: Id, period: string): FutureData<WardForm[]>;
}
