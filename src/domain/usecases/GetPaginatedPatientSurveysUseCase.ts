import { FutureData } from "../../data/api-futures";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";
import { getProgramId } from "../utils/PPSProgramsHelper";
import { PaginatedReponse } from "../entities/TablePagination";
import { PaginatedSurveyRepository } from "../repositories/PaginatedSurveyRepository";
import { SurveyRepository } from "../repositories/SurveyRepository";
import _ from "../entities/generic/Collection";
import { getPaginatedSurveysWithParentName } from "../utils/surveyParentNameHelper";

//This use case fetched only patient surveys for both Prevalence and PPS modules
export class GetPaginatedPatientSurveysUseCase {
    constructor(
        private paginatedSurveyRepo: PaginatedSurveyRepository,
        private surveyReporsitory: SurveyRepository
    ) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        parentSurveyId: Id | undefined,
        parentWardRegisterId: Id | undefined,
        page: number,
        pageSize: number
    ): FutureData<PaginatedReponse<Survey[]>> {
        const programId = getProgramId(surveyFormType);

        const parentId =
            surveyFormType === "PPSPatientRegister" ? parentWardRegisterId : parentSurveyId;

        return this.paginatedSurveyRepo
            .getSurveys(surveyFormType, programId, orgUnitId, parentId, page, pageSize)
            .flatMap(surveys => {
                return getPaginatedSurveysWithParentName(surveys, this.surveyReporsitory);
            });
    }
}
