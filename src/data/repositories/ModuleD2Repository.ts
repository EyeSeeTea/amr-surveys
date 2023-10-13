import { AMRSurveyModule } from "../../domain/entities/AmrSurveyModule";
import { ModuleRepository } from "../../domain/repositories/ModuleRepository";
import { FutureData } from "../api-futures";
import { DataStoreClient } from "../DataStoreClient";
import { DataStoreKeys } from "../DataStoreKeys";

export class ModuleD2Repository implements ModuleRepository {
    constructor(private dataStoreClient: DataStoreClient) {}
    getAll(): FutureData<AMRSurveyModule[]> {
        return this.dataStoreClient.listCollection<AMRSurveyModule>(DataStoreKeys.MODULES);
    }
}
