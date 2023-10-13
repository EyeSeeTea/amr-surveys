
import { FutureData } from "../../data/api-futures";
import { AMRSurveyModule } from "../entities/AmrSurveyModule";
import { ModuleRepository } from "../repositories/ModuleRepository";

export class GetAllModulesUseCase {
    constructor(private moduleRepository: ModuleRepository) {}

    public execute(): FutureData<AMRSurveyModule[]> {
        return this.moduleRepository.getAll();
    }
}
