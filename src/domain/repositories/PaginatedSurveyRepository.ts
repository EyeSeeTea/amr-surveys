import { FutureData } from "../../data/api-futures";
import { Id } from "../entities/Ref";
import {
    ChildCount,
    ChildCountNumber,
    ChildCountOption,
    Survey,
    SURVEY_FORM_TYPES,
} from "../entities/Survey";
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
    getFilteredPPSPatientByPatientIdSurveys(
        keyword: string,
        orgUnitId: Id,
        parentId: Id
    ): FutureData<PaginatedReponse<Survey[]>>;
    getFilteredPPSPatientByPatientCodeSurveys(
        keyword: string,
        orgUnitId: Id,
        parentId: Id
    ): FutureData<PaginatedReponse<Survey[]>>;
    getFilteredPrevalencePatientSurveysByPatientId(
        keyword: string,
        orgUnitId: Id,
        parentId: Id
    ): FutureData<PaginatedReponse<Survey[]>>;
    getPaginatedSurveyChildCount(
        parentProgram: Id,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId: Id | undefined
    ): FutureData<ChildCount>;
}
