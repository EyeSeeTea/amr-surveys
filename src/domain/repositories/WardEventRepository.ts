import { FutureData } from "../../data/api-futures";
import { WardEvent } from "../entities/Questionnaire/WardEvent";
import { OrgUnitAccess } from "../entities/User";

export interface WardEventRepository {
    get(facility: OrgUnitAccess): FutureData<WardEvent[]>;
}
