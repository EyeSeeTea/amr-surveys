import { Id } from "@eyeseetea/d2-api";
import { FutureData } from "../../data/api-futures";
import { Survey } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";

export class GetFilteredPatientsUseCase {
    constructor(private surveyFormRepository: SurveyRepository) {}

    public execute(keyword: string, orgUnitId: Id): FutureData<Survey[]> {
        return this.surveyFormRepository.getFilteredSurveys(keyword, orgUnitId);
    }
}
