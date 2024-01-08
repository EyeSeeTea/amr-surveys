import { FutureData } from "../../data/api-futures";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { Id } from "../entities/Ref";

import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";

export class DeleteSurveyUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(surveyFormType: SURVEY_FORM_TYPES, orgUnitId: Id, id: Id): FutureData<void> {
        const programId = getProgramId(surveyFormType);
        return this.surveyReporsitory.deleteSurvey(id, orgUnitId, programId);
    }
}
