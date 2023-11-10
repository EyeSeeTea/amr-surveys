import { AMRSurveyModule } from "../../../domain/entities/AMRSurveyModule";
import { Future } from "../../../domain/entities/generic/Future";
import { createModuleList } from "../../../domain/entities/__tests__/moduleFixtures";
import { ModuleRepository } from "../../../domain/repositories/ModuleRepository";
import { FutureData } from "../../api-futures";

export class ModulesTestRepository implements ModuleRepository {
    getProgramsEnrolledInOrgUnit(orgUnitId: string): FutureData<string[]> {
        console.debug(`Fetching programs enrolled for org unit : ${orgUnitId}`);
        return Future.success(["SiUPBRxBvSS", "iwwz8Xssua2"]);
    }
    getAll(): FutureData<AMRSurveyModule[]> {
        return Future.success(createModuleList());
    }
}
