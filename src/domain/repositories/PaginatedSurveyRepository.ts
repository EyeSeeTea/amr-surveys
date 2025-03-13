import { FutureData } from "../../data/api-futures";
import { PaginatedSurveyRepositoryProps } from "../../data/repositories/PaginatedSurveyD2Repository";
import { Id } from "../entities/Ref";
import { ChildCount, Survey, SURVEY_TYPES } from "../entities/Survey";
import { PaginatedReponse, SortColumnDetails } from "../entities/TablePagination";

export interface PaginatedSurveyRepository {
    getSurveys(
        options: PaginatedSurveyRepositoryProps,
        chunked: boolean
    ): FutureData<PaginatedReponse<Survey[]>>;

    getFilteredPPSPatientByPatientIdSurveys(
        keyword: string,
        orgUnitId: Id,
        parentId: Id,
        sortColumnDetails?: SortColumnDetails
    ): FutureData<PaginatedReponse<Survey[]>>;
    getFilteredPPSPatientByPatientCodeSurveys(
        keyword: string,
        orgUnitId: Id,
        parentId: Id,
        sortColumnDetails?: SortColumnDetails
    ): FutureData<PaginatedReponse<Survey[]>>;
    getFilteredPrevalencePatientSurveysByPatientId(
        keyword: string,
        orgUnitId: Id,
        parentId: Id,
        sortColumnDetails?: SortColumnDetails
    ): FutureData<PaginatedReponse<Survey[]>>;
    getFilteredPPSSurveys(
        orgUnitId: Id,
        surveyType: SURVEY_TYPES | undefined,
        page: number,
        pageSize: number,
        sortColumnDetails?: SortColumnDetails
    ): FutureData<PaginatedReponse<Survey[]>>;
    getPaginatedSurveyChildCount(
        parentProgram: Id,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId: Id | undefined
    ): FutureData<ChildCount>;
}
