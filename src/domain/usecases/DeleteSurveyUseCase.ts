import { FutureData } from "../../data/api-futures";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { Id } from "../entities/Ref";

import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";

export class DeleteSurveyUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        eventId: Id
    ): FutureData<void> {
        const programId = getProgramId(surveyFormType);
        console.log("4- DeleteSurveyUseCase: ", eventId, orgUnitId, programId);
        return this.surveyReporsitory.deleteSurvey(eventId, orgUnitId, programId);
    }
}
