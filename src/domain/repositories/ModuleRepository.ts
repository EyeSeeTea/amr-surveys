import { FutureData } from "../../data/api-futures";
import { AMRSurveyModule } from "../entities/AmrSurveyModule";

export interface ModuleRepository {
    getAll(): FutureData<AMRSurveyModule[]>;
}
