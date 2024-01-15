import { Id } from "@eyeseetea/d2-api";
import { FutureData } from "../../data/api-futures";
import { Survey } from "../entities/Survey";
import { PaginatedReponse } from "../entities/TablePagination";
import { PaginatedSurveyRepository } from "../repositories/PaginatedSurveyRepository";

export class GetFilteredPatientsUseCase {
    constructor(private paginatedSurveyRepo: PaginatedSurveyRepository) {}

    public execute(keyword: string, orgUnitId: Id): FutureData<PaginatedReponse<Survey[]>> {
        return this.paginatedSurveyRepo.getFilteredPPSPatientSurveys(keyword, orgUnitId);
    }
}
