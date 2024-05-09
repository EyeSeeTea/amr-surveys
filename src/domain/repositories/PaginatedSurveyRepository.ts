import { FutureData } from "../../data/api-futures";
import { SurveyChildCountType } from "../../data/utils/surveyChildCountHelper";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";
import { PaginatedReponse } from "../entities/TablePagination";

export interface PaginatedSurveyRepository {
    getSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id,
        parentWardRegisterId: Id | undefined,
        page: number,
        pageSize: number
    ): FutureData<PaginatedReponse<Survey[]>>;
    getFilteredPPSPatientSurveys(
        keyword: string,
        orgUnitId: Id
    ): FutureData<PaginatedReponse<Survey[]>>;
    getPaginatedSurveyChildCount(
        parentProgram: Id,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId: Id | undefined
    ): SurveyChildCountType;
}
