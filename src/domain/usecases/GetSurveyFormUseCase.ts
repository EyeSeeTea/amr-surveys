import { FutureData } from "../../data/api-futures";
import { Questionnaire } from "../entities/Questionnaire";

import { SurveyFormRepository } from "../repositories/SurveyFormRepository";

const SURVEY_FORM_ID = "OGOw5Kt3ytv";
export class GetSurveyFormUseCase {
    constructor(private surveyFormReporsitory: SurveyFormRepository) {}

    public execute(): FutureData<Questionnaire> {
        return this.surveyFormReporsitory.getForm(SURVEY_FORM_ID);
    }
}
