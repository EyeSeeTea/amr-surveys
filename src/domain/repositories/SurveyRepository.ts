import { FutureData } from "../../data/api-futures";
import { ImportStrategy } from "../entities/Program";
import { Questionnaire } from "../entities/Questionnaire";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";

export interface SurveyRepository {
    getForm(programId: Id, eventId: Id | undefined): FutureData<Questionnaire>;
    saveFormData(
        events: Questionnaire,
        action: ImportStrategy,
        orgUnitId: Id,
        eventId: string | undefined,
        programId: Id
    ): FutureData<void>;
    getSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id
    ): FutureData<Survey[]>;
    getPopulatedSurveyById(eventId: Id, programId: Id): FutureData<Questionnaire>;
    getSurveyNameFromId(id: Id): FutureData<string | undefined>;
}
