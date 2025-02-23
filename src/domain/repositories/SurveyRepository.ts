import { FutureData } from "../../data/api-futures";
import { ASTGUIDELINE_TYPES } from "../entities/ASTGuidelines";
import { ImportStrategy } from "../entities/Program";
import { Questionnaire } from "../entities/Questionnaire/Questionnaire";
import { Id } from "../entities/Ref";
import { ChildCount, SURVEY_FORM_TYPES } from "../entities/Survey";

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
    ): FutureData<Id>;

    getPopulatedSurveyById(
        eventId: Id,
        programId: Id,
        orgUnitId: Id | undefined
    ): FutureData<Questionnaire>;

    deleteSurvey(id: Id, orgUnitId: Id, programId: Id): FutureData<void>;
    deleteEventSurvey(eventId: Id, orgUnitId: Id, programId: Id): FutureData<void>;

    getSurveyNameAndASTGuidelineFromId(
        id: Id,
        surveyFormType: SURVEY_FORM_TYPES
    ): FutureData<{ name: string; astGuidelineType?: ASTGUIDELINE_TYPES }>;

    getNonPaginatedSurveyChildCount(
        parentProgram: Id,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId: Id | undefined
    ): FutureData<ChildCount>;
}

export type GetSurveyOptions = {
    surveyFormType: SURVEY_FORM_TYPES;
    programId: Id;
    parentId?: Id;
    orgUnitId: Id;
    chunked: boolean;
};
