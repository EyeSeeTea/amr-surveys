import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { FutureData } from "../../data/api-futures";
import { ImportStrategy } from "../entities/EventProgram";
import { Questionnaire } from "../entities/Questionnaire";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";

export interface SurveyRepository {
    getForm(programId: Id, event: D2TrackerEvent | undefined): FutureData<Questionnaire>;
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
    getSurveyById(eventId: string): FutureData<D2TrackerEvent>;
    getPopulatedSurveyById(eventId: Id, programId: Id): FutureData<Questionnaire>;
    getSurveyNameFromId(id: Id): FutureData<string | undefined>;
}
