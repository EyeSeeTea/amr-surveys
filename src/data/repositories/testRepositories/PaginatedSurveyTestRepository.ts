/* eslint-disable @typescript-eslint/no-unused-vars */
import { ProgramCountMap } from "../../../domain/entities/Program";
import { SURVEY_FORM_TYPES, Survey } from "../../../domain/entities/Survey";
import { PaginatedReponse } from "../../../domain/entities/TablePagination";
import { PaginatedSurveyRepository } from "../../../domain/repositories/PaginatedSurveyRepository";
import { FutureData } from "../../api-futures";
import { SurveyChildCountType } from "../../utils/surveyChildCountHelper";

export class PaginatedSurveyTestRepository implements PaginatedSurveyRepository {
    getFilteredPrevalencePatientSurveysByPatientId(
        keyword: string,
        orgUnitId: string,
        parentId: string
    ): FutureData<PaginatedReponse<Survey[]>> {
        throw new Error("Method not implemented.");
    }
    getFilteredPPSPatientByPatientCodeSurveys(
        keyword: string,
        orgUnitId: string,
        parentId: string
    ): FutureData<PaginatedReponse<Survey[]>> {
        console.debug(keyword, orgUnitId, parentId);
        throw new Error("Method not implemented.");
    }
    getFilteredPPSPatientByPatientIdSurveys(
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
    getPaginatedSurveyChildCount(
        parentProgram: string,
        orgUnitId: string,
        parentSurveyId: string,
        secondaryparentId: string | undefined
    ): SurveyChildCountType {
        throw new Error("Method not implemented.");
    }
}
