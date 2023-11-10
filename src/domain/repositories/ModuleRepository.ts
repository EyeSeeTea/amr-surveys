import { FutureData } from "../../data/api-futures";
import { AMRSurveyModule } from "../entities/AMRSurveyModule";
import { Id } from "../entities/Ref";

export interface ModuleRepository {
    getAll(): FutureData<AMRSurveyModule[]>;
    getProgramsEnrolledInOrgUnit(orgUnitId: Id): FutureData<Id[]>;
}
