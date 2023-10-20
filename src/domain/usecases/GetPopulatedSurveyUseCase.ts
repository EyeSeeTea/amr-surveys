import { Id } from "@eyeseetea/d2-api";
import { FutureData } from "../../data/api-futures";
import { PPS_SURVEY_FORM_ID } from "../../data/repositories/SurveyFormD2Repository";
import { Future } from "../entities/generic/Future";
import { Questionnaire } from "../entities/Questionnaire";
import { SURVEY_FORM_TYPES } from "../entities/Survey";

import { SurveyRepository } from "../repositories/SurveyRepository";

export class GetPopulatedSurveyUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(eventId: Id, surveyType: SURVEY_FORM_TYPES): FutureData<Questionnaire> {
        let programId = "";
        switch (surveyType) {
            case "PPSSurveyForm":
                programId = PPS_SURVEY_FORM_ID;
                break;
            default:
                return Future.error(new Error("Unknown survey type"));
        }

        return this.surveyReporsitory.getSurveyById(eventId).flatMap(event => {
            return this.surveyReporsitory.getForm(programId, event);
        });
    }
}
