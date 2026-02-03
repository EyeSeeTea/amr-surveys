import { FutureData } from "../../data/api-futures";
import { WardEvent } from "../entities/Questionnaire/WardEvent";

export interface WardEventRepository {
    get(facilityId: string): FutureData<WardEvent[]>;
}
