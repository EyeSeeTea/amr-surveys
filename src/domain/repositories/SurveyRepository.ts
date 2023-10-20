import { FutureData } from "../../data/api-futures";
import { ImportStrategy, TrackerEventsPostRequest } from "../entities/EventProgram";
import { Questionnaire } from "../entities/Questionnaire";
import { Id } from "../entities/Ref";
import { Survey } from "../entities/Survey";

export interface SurveyRepository {
    getForm(programId: Id): FutureData<Questionnaire>;
    saveFormData(events: TrackerEventsPostRequest, action: ImportStrategy): FutureData<void>;
    getSurveys(programId: Id, orgUnitId: Id): FutureData<Survey[]>;
}
