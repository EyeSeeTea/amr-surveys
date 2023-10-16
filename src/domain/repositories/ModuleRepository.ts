import { Id } from "@eyeseetea/d2-api";
import { FutureData } from "../../data/api-futures";
import { AMRSurveyModule } from "../entities/AMRSurveyModule";

export interface ModuleRepository {
    getAll(): FutureData<AMRSurveyModule[]>;
    getProgramsEnrolledInOrgUnit(orgUnitId: Id): FutureData<Id[]>;
}
