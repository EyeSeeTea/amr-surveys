import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";
import { GLOBAL_OU_ID } from "./SaveFormDataUseCase";
import _ from "../entities/generic/Collection";
import { PaginatedReponse } from "../entities/TablePagination";

export class GetAllSurveysUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        parentPPSSurveyId: Id | undefined,
        parentWardRegisterId: Id | undefined,
        page: number,
        pageSize: number
    ): FutureData<PaginatedReponse<Survey[]>> {
        const programId = getProgramId(surveyFormType);

        //All PPS Survey Forms are Global.
        if (surveyFormType === "PPSSurveyForm") orgUnitId = GLOBAL_OU_ID;

        return this.surveyReporsitory
            .getSurveys(surveyFormType, programId, orgUnitId, page, pageSize)
            .flatMap(({ pager, objects: surveys }) => {
                if (
                    surveyFormType === "PPSSurveyForm" ||
                    (surveyFormType === "PPSHospitalForm" && !parentPPSSurveyId)
                ) {
                    return Future.success({
                        pager: pager,
                        objects: surveys,
                    });
                } else {
                    if (surveyFormType === "PPSPatientRegister") {
                        //Filter Surveys by parentWardRegisterId
                        const filteredSurveys = _(
                            surveys.map(survey => {
                                if (survey.parentWardRegisterId === parentWardRegisterId)
                                    return survey;
                            })
                        )
                            .compact()
                            .value();

                        return Future.success({
                            pager: pager,
                            objects: filteredSurveys,
                        });
                    } else {
                        //Filter Surveys by parentPPSSurveyId
                        const filteredSurveys = _(
                            surveys.map(survey => {
                                if (survey.rootSurvey.id === parentPPSSurveyId) return survey;
                            })
                        )
                            .compact()
                            .value();

                        return Future.success({
                            pager: pager,
                            objects: filteredSurveys,
                        });
                    }
                }
            });
    }
}
