import { FutureData } from "../../data/api-futures";
import { ImportStrategy } from "../entities/EventProgram";
import { Questionnaire } from "../entities/Questionnaire";
import { Id } from "../entities/Ref";
import { Survey } from "../entities/Survey";

export interface SurveyRepository {
    getForm(programId: Id, eventId: Id | undefined): FutureData<Questionnaire>;
    saveFormData(
        events: Questionnaire,
        action: ImportStrategy,
        orgUnitId: Id,
        eventId: string | undefined,
        programId: Id
    ): FutureData<void>;
    getSurveys(programId: Id, orgUnitId: Id): FutureData<Survey[]>;
}
