import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";
import { GLOBAL_OU_ID } from "./SaveFormDataUseCase";
import _ from "../entities/generic/Collection";
import { GetMultipleSurveysUseCase } from "./GetMultipleSurveysUseCase";

export class GetAllSurveysUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        parentSurveyId: Id | undefined,
        parentWardRegisterId: Id | undefined
    ): FutureData<Survey[]> {
        if (surveyFormType === "PrevalencePatientForms") {
            const multipleSurveysUseCase = new GetMultipleSurveysUseCase(this.surveyReporsitory);
            return multipleSurveysUseCase.execute(surveyFormType, orgUnitId, parentSurveyId);
        } else {
            const programId = getProgramId(surveyFormType);

            //All PPS  Survey Forms are Global.
            if (surveyFormType === "PPSSurveyForm") orgUnitId = GLOBAL_OU_ID;
            return this.surveyReporsitory
                .getSurveys(surveyFormType, programId, orgUnitId)
                .flatMap(surveys => {
                    if (
                        surveyFormType === "PPSSurveyForm" ||
                        surveyFormType === "PrevalenceSurveyForm" ||
                        (surveyFormType === "PPSHospitalForm" && !parentSurveyId)
                    ) {
                        return Future.success(surveys);
                    } else {
                        if (surveyFormType === "PPSPatientRegister") {
                            //Filter Surveys by parentWardRegisterId
                            return Future.success(
                                surveys.filter(
                                    survey => survey.parentWardRegisterId === parentWardRegisterId
                                )
                            );
                        } else {
                            //Filter Surveys by parentSurveyId
                            return Future.success(
                                surveys.filter(survey => survey.rootSurvey.id === parentSurveyId)
                            );
                        }
                    }
                });
        }
    }
}
