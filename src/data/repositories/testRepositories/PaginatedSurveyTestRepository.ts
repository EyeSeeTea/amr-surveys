/* eslint-disable @typescript-eslint/no-unused-vars */
import { SURVEY_FORM_TYPES, Survey } from "../../../domain/entities/Survey";
import { PaginatedReponse } from "../../../domain/entities/TablePagination";
import { PaginatedSurveyRepository } from "../../../domain/repositories/PaginatedSurveyRepository";
import { FutureData } from "../../api-futures";

export class PaginatedSurveyTestRepository implements PaginatedSurveyRepository {
    getFilteredPPSPatientSurveys(
        keyword: string,
        orgUnitId: string
    ): FutureData<PaginatedReponse<Survey[]>> {
        throw new Error("Method not implemented.");
    }
    getFilteredPrevalencePatientSurveys(
        keyword: string,
        orgUnitId: string
    ): FutureData<PaginatedReponse<Survey[]>> {
        throw new Error("Method not implemented.");
    }
    getSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: string,
        orgUnitId: string,
        parentWardRegisterId: string | undefined,
        page: number,
        pageSize: number
    ): FutureData<PaginatedReponse<Survey[]>> {
        throw new Error("Method not implemented.");
    }
}
