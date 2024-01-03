import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";
import { GLOBAL_OU_ID } from "./SaveFormDataUseCase";
import _ from "../entities/generic/Collection";

export class GetAllSurveysUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        parentSurveyId: Id | undefined
    ): FutureData<Survey[]> {
        const programId = getProgramId(surveyFormType);

        //All PPS Survey Forms are Global.
        const ouId = surveyFormType === "PPSSurveyForm" ? GLOBAL_OU_ID : orgUnitId;

        return this.surveyReporsitory
            .getSurveys(surveyFormType, programId, ouId)
            .flatMap(surveys => {
                if (
                    surveyFormType === "PPSSurveyForm" ||
                    (surveyFormType === "PPSHospitalForm" && !parentSurveyId) ||
                    surveyFormType === "PrevalenceSurveyForm"
                ) {
                    return Future.success(surveys);
                } else {
                    //Filter Surveys by parentPPSSurveyId
                    const filteredSurveys = _(
                        surveys.map(survey => {
                            if (survey.rootSurvey.id === parentSurveyId) return survey;
                        })
                    )
                        .compact()
                        .value();

                    return Future.success(filteredSurveys);
                }
            });
    }
}
