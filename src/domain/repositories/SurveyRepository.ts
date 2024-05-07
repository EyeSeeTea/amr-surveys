import { FutureData } from "../../data/api-futures";
import { ASTGUIDELINE_TYPES } from "../entities/ASTGuidelines";
import { ImportStrategy, ProgramCountMap } from "../entities/Program";
import { Questionnaire } from "../entities/Questionnaire/Questionnaire";
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
    ): FutureData<Id | undefined>;
    getSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id,
        chunked: boolean
    ): FutureData<Survey[]>;
    getPopulatedSurveyById(
        eventId: Id,
        programId: Id,
        orgUnitId: Id | undefined
    ): FutureData<Questionnaire>;

    deleteSurvey(id: Id, orgUnitId: Id, programId: Id): FutureData<void>;

    getSurveyNameAndASTGuidelineFromId(
        id: Id,
        surveyFormType: SURVEY_FORM_TYPES
    ): FutureData<{ name: string; astGuidelineType?: ASTGUIDELINE_TYPES }>;

    getSurveyChildCount(
        parentProgram: Id,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId: Id | undefined
    ):
        | { type: "value"; value: FutureData<number> }
        | { type: "map"; value: FutureData<ProgramCountMap> };
}
