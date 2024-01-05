import { FutureData } from "../../data/api-futures";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { Id } from "../entities/Ref";

import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";

export class GetChildCountUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId?: Id
    ): FutureData<number> {
        const programId = getProgramId(surveyFormType);
        return this.surveyReporsitory.getSurveyChildCount(
            programId,
            orgUnitId,
            parentSurveyId,
            secondaryparentId
        );
    }
}