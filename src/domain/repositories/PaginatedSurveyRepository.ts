import { FutureData } from "../../data/api-futures";
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
    getFilteredPrevalencePatientSurveys(
        keyword: string,
        orgUnitId: Id
    ): FutureData<PaginatedReponse<Survey[]>>;
}
