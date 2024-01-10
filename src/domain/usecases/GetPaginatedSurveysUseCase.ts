import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";
import { getProgramId } from "../utils/PPSProgramsHelper";
import { GLOBAL_OU_ID } from "./SaveFormDataUseCase";
import _ from "../entities/generic/Collection";
import { GetAllPrevelancePatientSurveysUseCase } from "./GetAllPrevelancePatientSurveysUseCase";
import { PaginatedReponse } from "../entities/TablePagination";
import { PaginatedSurveyRepository } from "../repositories/PaginatedSurveyRepository";

export class GetPaginatedSurveysUseCase {
    constructor(private paginatedSurveyRepo: PaginatedSurveyRepository) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        parentSurveyId: Id | undefined,
        parentWardRegisterId: Id | undefined,
        page: number,
        pageSize: number
    ): FutureData<PaginatedReponse<Survey[]>> {
        if (surveyFormType === "PrevalencePatientForms") {
            const multipleSurveysUseCase = new GetAllPrevelancePatientSurveysUseCase(
                this.paginatedSurveyRepo
            );
            return multipleSurveysUseCase
                .execute(surveyFormType, orgUnitId, parentSurveyId, page, pageSize)
                .flatMap(surveys => {
                    return Future.success(surveys);
                });
        } else {
            const programId = getProgramId(surveyFormType);

            //All PPS Survey Forms are Global.
            if (surveyFormType === "PPSSurveyForm") orgUnitId = GLOBAL_OU_ID;

            return this.paginatedSurveyRepo
                .getSurveys(
                    surveyFormType,
                    programId,
                    orgUnitId,
                    parentWardRegisterId,
                    page,
                    pageSize
                )
                .flatMap(surveys => {
                    return Future.success(surveys);
                });
        }
    }
}
