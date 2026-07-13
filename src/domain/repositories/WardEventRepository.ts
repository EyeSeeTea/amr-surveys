import { FutureData } from "../../data/api-futures";
import { WardEvent } from "../entities/Questionnaire/WardEvent";
import { WardStatisticsFormType } from "../entities/Survey";
import { OrgUnitAccess } from "../entities/User";

export interface WardEventRepository {
    get(facility: OrgUnitAccess, wardFormType: WardStatisticsFormType): FutureData<WardEvent[]>;
}
