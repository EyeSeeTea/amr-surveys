import { FutureData } from "../../data/api-futures";
import { ImportStrategy } from "../entities/EventProgram";
import { Questionnaire } from "../entities/Questionnaire";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";
import { PaginatedReponse } from "../entities/TablePagination";

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
        orgUnitId: Id,
        parentWardRegisterId: Id | undefined,
        page: number,
        pageSize: number
    ): FutureData<PaginatedReponse<Survey[]>>;
    getPopulatedSurveyById(eventId: Id, programId: Id): FutureData<Questionnaire>;
    getSurveyNameFromId(id: Id): FutureData<string | undefined>;
    deleteSurvey(eventId: Id, orgUnitId: Id, programId: Id): FutureData<void>;
}
