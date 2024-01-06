import { FutureData } from "../../data/api-futures";
import { ProgramCountMap } from "../../data/repositories/SurveyFormD2Repository";
import { ImportStrategy } from "../entities/Program";
import { Questionnaire } from "../entities/Questionnaire";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";

export interface SurveyRepository {
    getForm(
        programId: Id,
        eventId: Id | undefined,
        orgUnitId: Id | undefined
    ): FutureData<Questionnaire>;
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
    getPopulatedSurveyById(
        eventId: Id,
        programId: Id,
        orgUnitId: Id | undefined
    ): FutureData<Questionnaire>;

    deleteSurvey(eventId: Id, orgUnitId: Id, programId: Id): FutureData<void>;

    getSurveyNameFromId(id: Id, surveyFormType: SURVEY_FORM_TYPES): FutureData<string>;

    getSurveyChildCount(
        parentProgram: Id,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId: Id | undefined
    ): FutureData<number | ProgramCountMap>;
}
