import { FutureData } from "../../data/api-futures";
import { Id } from "../entities/Ref";
import { SurveyRepository } from "../repositories/SurveyRepository";

export class GetSurveyAntibioticsBlacklistUseCase {
    constructor(private surveyRepository: SurveyRepository) {}

    public execute(surveyId: Id): FutureData<string[]> {
        return this.surveyRepository.getSurveyAntibioticsBlacklist(surveyId);
    }
}
