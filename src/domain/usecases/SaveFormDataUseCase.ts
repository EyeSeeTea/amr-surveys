import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { Questionnaire } from "../entities/Questionnaire";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import _ from "../../domain/entities/generic/Collection";
import { PPS_SURVEY_FORM_ID } from "../../data/repositories/SurveyFormD2Repository";
import { Id } from "../entities/Ref";

export class SaveFormDataUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyType: SURVEY_FORM_TYPES,
        questionnaire: Questionnaire,
        orgUnitId: Id,
        eventId: string | undefined = undefined
    ): FutureData<void> {
        let programId = "";
        switch (surveyType) {
            case "PPSSurveyForm":
                programId = PPS_SURVEY_FORM_ID;
                break;
            default:
                return Future.error(new Error("Unknown survey type"));
        }

        return this.surveyReporsitory.saveFormData(
            questionnaire,
            "CREATE_AND_UPDATE",
            orgUnitId,
            eventId,
            programId
        );
    }
}
