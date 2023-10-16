import { Id } from "@eyeseetea/d2-api";
import { FutureData } from "../../data/api-futures";
import { Survey } from "../entities/Survey";

export interface SurveyRepository {
    getAll(programId: Id, orgUnitId: Id): FutureData<Survey[]>;
}
