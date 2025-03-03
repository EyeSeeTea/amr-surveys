import { FutureData } from "../../data/api-futures";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_TYPES } from "../entities/Survey";
import { PaginatedReponse, SortColumnDetails } from "../entities/TablePagination";
import { PaginatedSurveyRepository } from "../repositories/PaginatedSurveyRepository";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { getPaginatedSurveysWithParentName } from "../utils/surveyParentNameHelper";

export class GetFilteredRootSurveysUseCase {
    constructor(
        private paginatedSurveyRepo: PaginatedSurveyRepository,
        private surveyReporsitory: SurveyRepository
    ) {}

    public execute(
        orgUnitId: Id,
        surveyType: SURVEY_TYPES | undefined,
        page: number,
        pageSize: number,
        sortColumnDetails?: SortColumnDetails
    ): FutureData<PaginatedReponse<Survey[]>> {
        return this.paginatedSurveyRepo
            .getFilteredPPSSurveys(orgUnitId, surveyType, page, pageSize, sortColumnDetails)
            .flatMap(filteredSurveys => {
                return getPaginatedSurveysWithParentName(filteredSurveys, this.surveyReporsitory);
            });
    }
}
