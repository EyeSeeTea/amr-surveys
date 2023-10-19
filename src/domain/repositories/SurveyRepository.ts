import { FutureData } from "../../data/api-futures";
import { ImportStrategy, TrackerEventsPostRequest } from "../entities/EventProgram";
import { Questionnaire } from "../entities/Questionnaire";
import { Id } from "../entities/Ref";

export interface SurveyRepository {
    getForm(programId: Id): FutureData<Questionnaire>;
    saveFormData(events: TrackerEventsPostRequest, action: ImportStrategy): FutureData<void>;
}
