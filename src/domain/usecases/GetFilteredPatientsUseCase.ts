import { Id } from "@eyeseetea/d2-api";
import { FutureData } from "../../data/api-futures";
import { Survey } from "../entities/Survey";
import { PaginatedReponse } from "../entities/TablePagination";
import { PaginatedSurveyRepository } from "../repositories/PaginatedSurveyRepository";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { getPaginatedSurveysWithParentName } from "../utils/surveyParentNameHelper";

export class GetFilteredPatientsUseCase {
    constructor(
        private paginatedSurveyRepo: PaginatedSurveyRepository,
        private surveyReporsitory: SurveyRepository
    ) {}

    public execute(
        keyword: string,
        orgUnitId: Id,
        parentId: Id,
        searchBy: "patientId" | "patientCode"
    ): FutureData<PaginatedReponse<Survey[]>> {
        if (searchBy === "patientId") {
            return this.paginatedSurveyRepo
                .getFilteredPPSPatientByPatientIdSurveys(keyword, orgUnitId, parentId)
                .flatMap(filteredSurveys => {
                    return getPaginatedSurveysWithParentName(
                        filteredSurveys,
                        this.surveyReporsitory
                    );
                });
        } else {
            return this.paginatedSurveyRepo
                .getFilteredPPSPatientByPatientCodeSurveys(keyword, orgUnitId, parentId)
                .flatMap(filteredSurveys => {
                    return getPaginatedSurveysWithParentName(
                        filteredSurveys,
                        this.surveyReporsitory
                    );
                });
        }
    }
}
