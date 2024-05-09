import { FutureData } from "../../data/api-futures";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { Id } from "../entities/Ref";

import { SurveyRepository } from "../repositories/SurveyRepository";
import { ProgramOptionCountMap } from "../entities/Program";
import { getChildCount } from "../utils/getChildCountHelper";

export class GetChildCountUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId?: Id
    ): FutureData<number | ProgramOptionCountMap> {
        return getChildCount({
            surveyFormType: surveyFormType,
            orgUnitId: orgUnitId,
            parentSurveyId: parentSurveyId,
            secondaryparentId: secondaryparentId,
            surveyReporsitory: this.surveyReporsitory,
        });
    }
}
