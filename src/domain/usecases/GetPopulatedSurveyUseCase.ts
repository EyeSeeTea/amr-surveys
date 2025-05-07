import { FutureData } from "../../data/api-futures";
import { Questionnaire } from "../entities/Questionnaire/Questionnaire";
import { Id } from "../entities/Ref";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { ModuleRepository } from "../repositories/ModuleRepository";

import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";

export class GetPopulatedSurveyUseCase {
    constructor(
        private surveyReporsitory: SurveyRepository,
        private moduleRepository: ModuleRepository
    ) {}

    public execute(
        eventId: Id,
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id | undefined,
        parentSurveyId: Id | undefined
    ): FutureData<Questionnaire> {
        return this.moduleRepository.getAll().flatMap(modules => {
            const programId = getProgramId(surveyFormType, parentSurveyId, modules);
            return this.surveyReporsitory.getPopulatedSurveyById(eventId, programId, orgUnitId);
        });
    }
}
