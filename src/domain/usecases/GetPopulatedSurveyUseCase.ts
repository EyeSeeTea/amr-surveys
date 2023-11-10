import { FutureData } from "../../data/api-futures";
import { Questionnaire } from "../entities/Questionnaire";
import { Id } from "../entities/Ref";
import { SURVEY_FORM_TYPES } from "../entities/Survey";

import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";

export class GetPopulatedSurveyUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(eventId: Id, surveyType: SURVEY_FORM_TYPES): FutureData<Questionnaire> {
        const programId = getProgramId(surveyType);
        return this.surveyReporsitory.getForm(eventId, programId);
    }
}
