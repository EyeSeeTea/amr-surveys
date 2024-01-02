import { Id } from "@eyeseetea/d2-api";
import { FutureData } from "../../data/api-futures";
import { Survey } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { PaginatedReponse } from "../entities/TablePagination";

export class GetFilteredPatientsUseCase {
    constructor(private surveyFormRepository: SurveyRepository) {}

    public execute(keyword: string, orgUnitId: Id): FutureData<PaginatedReponse<Survey[]>> {
        return this.surveyFormRepository.getFilteredSurveys(keyword, orgUnitId);
    }
}
