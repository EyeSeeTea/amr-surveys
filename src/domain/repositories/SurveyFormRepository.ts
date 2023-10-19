import { FutureData } from "../../data/api-futures";
import { Questionnaire } from "../entities/Questionnaire";
import { Id } from "../entities/Ref";

export interface SurveyFormRepository {
    getForm(programId: Id): FutureData<Questionnaire>;
}
