import { FutureData } from "../../data/api-futures";
import { Id } from "../entities/Ref";
import { ChildCount, Survey, SURVEY_FORM_TYPES } from "../entities/Survey";
import { PaginatedReponse, SortColumnDetails, SortOrder } from "../entities/TablePagination";

export interface PaginatedSurveyRepository {
    getSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id,
        parentId: Id | undefined,
        page: number,
        pageSize: number,
        chunked: boolean,
        sortOrder?: SortColumnDetails
    ): FutureData<PaginatedReponse<Survey[]>>;

    getFilteredPPSPatientByPatientIdSurveys(
        keyword: string,
        orgUnitId: Id,
        parentId: Id,
        sortOrder?: SortOrder
    ): FutureData<PaginatedReponse<Survey[]>>;
    getFilteredPPSPatientByPatientCodeSurveys(
        keyword: string,
        orgUnitId: Id,
        parentId: Id,
        sortOrder?: SortOrder
    ): FutureData<PaginatedReponse<Survey[]>>;
    getFilteredPrevalencePatientSurveysByPatientId(
        keyword: string,
        orgUnitId: Id,
        parentId: Id,
        sortOrder?: SortOrder
    ): FutureData<PaginatedReponse<Survey[]>>;
    getPaginatedSurveyChildCount(
        parentProgram: Id,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId: Id | undefined
    ): FutureData<ChildCount>;
}
