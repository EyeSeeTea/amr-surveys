import { Id } from "@eyeseetea/d2-api";
import { FutureData } from "../../data/api-futures";
import { SURVEY_FORM_TYPES, Survey } from "../entities/Survey";
import { PaginatedReponse } from "../entities/TablePagination";
import { PaginatedSurveyRepository } from "../repositories/PaginatedSurveyRepository";
import { Future } from "../entities/generic/Future";

export class GetFilteredPatientsUseCase {
    constructor(private paginatedSurveyRepo: PaginatedSurveyRepository) {}

    public execute(
        keyword: string,
        orgUnitId: Id,
        surveyFormType: SURVEY_FORM_TYPES
    ): FutureData<PaginatedReponse<Survey[]>> {
        if (surveyFormType === "PPSPatientRegister") {
            return this.paginatedSurveyRepo.getFilteredPPSPatientSurveys(keyword, orgUnitId);
        } else if (surveyFormType === "PrevalenceCaseReportForm") {
            return this.paginatedSurveyRepo.getFilteredPrevalencePatientSurveys(keyword, orgUnitId);
        } else {
            return Future.error(new Error("Unsupported survey form type"));
        }
    }
}
