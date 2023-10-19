import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { Questionnaire } from "../entities/Questionnaire";
import { PPS_SURVEY_FORM_ID, SURVEY_FORM_TYPES } from "../entities/Survey";

import { SurveyRepository } from "../repositories/SurveyRepository";

export class GetSurveyUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(surveyType: SURVEY_FORM_TYPES): FutureData<Questionnaire> {
        let programId = "";
        switch (surveyType) {
            case "PPSSurveyForm":
                programId = PPS_SURVEY_FORM_ID;
                break;
            default:
                return Future.error(new Error("Unknown survey type"));
        }

        return this.surveyReporsitory.getForm(programId);
    }
}
