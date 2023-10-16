import { FutureData } from "../../data/api-futures";
import { AMRSurveyModule } from "../entities/AMRSurveyModule";

export interface ModuleRepository {
    getAll(): FutureData<AMRSurveyModule[]>;
}
