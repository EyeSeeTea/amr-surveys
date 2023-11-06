import { FutureData } from "../../data/api-futures";
import { PPS_SURVEY_FORM_ID } from "../../data/repositories/SurveyFormD2Repository";
import { Future } from "../entities/generic/Future";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";

export class GetAllSurveysUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(surveyType: SURVEY_FORM_TYPES, orgUnitId: Id): FutureData<Survey[]> {
        let programId = "";
        switch (surveyType) {
            case "PPSSurveyForm":
                programId = PPS_SURVEY_FORM_ID;
                break;
            default:
                return Future.error(new Error("Unknown survey type"));
        }

        return this.surveyReporsitory.getSurveys(programId, orgUnitId);
    }
}
