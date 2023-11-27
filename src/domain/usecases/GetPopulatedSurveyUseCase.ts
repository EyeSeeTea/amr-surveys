import { Id } from "@eyeseetea/d2-api";
import { FutureData } from "../../data/api-futures";
import { Questionnaire } from "../entities/Questionnaire";
import { SURVEY_FORM_TYPES } from "../entities/Survey";

import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";

export class GetPopulatedSurveyUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(eventId: Id, surveyFormType: SURVEY_FORM_TYPES): FutureData<Questionnaire> {
        const programId = getProgramId(surveyFormType);
        return this.surveyReporsitory.getPopulatedSurveyById(eventId, programId);
    }
}
