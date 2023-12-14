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
        parentSurveyId: Id | undefined,
        parentWardRegisterId: Id | undefined
    ): FutureData<Survey[]> {
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
                        const filteredSurveys = _(
                            surveys.map(survey => {
                                if (survey.parentWardRegisterId === parentWardRegisterId)
                                    return survey;
                            })
                        )
                            .compact()
                            .value();

                        return Future.success(filteredSurveys);
                    } else {
                        //Filter Surveys by parentSurveyId
                        const filteredSurveys = _(
                            surveys.map(survey => {
                                if (survey.rootSurvey.id === parentSurveyId) return survey;
                            })
                        )
                            .compact()
                            .value();

                        return Future.success(filteredSurveys);
                    }
                }
            });
    }
}
