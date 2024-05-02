import { FutureData } from "../../data/api-futures";
import { ProgramCountMap } from "../entities/Program";
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
    getSurveyChildCount(
        parentProgram: Id,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId: Id | undefined
    ):
        | { type: "value"; value: FutureData<number> }
        | { type: "map"; value: FutureData<ProgramCountMap> };
}
