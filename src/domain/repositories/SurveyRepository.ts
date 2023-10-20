import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { FutureData } from "../../data/api-futures";
import { ImportStrategy, TrackerEventsPostRequest } from "../entities/EventProgram";
import { Questionnaire } from "../entities/Questionnaire";
import { Id } from "../entities/Ref";
import { Survey } from "../entities/Survey";

export interface SurveyRepository {
    getForm(programId: Id, event: D2TrackerEvent | undefined): FutureData<Questionnaire>;
    saveFormData(events: TrackerEventsPostRequest, action: ImportStrategy): FutureData<void>;
    getSurveys(programId: Id, orgUnitId: Id): FutureData<Survey[]>;
    getSurveyById(eventId: string): FutureData<D2TrackerEvent>;
}
