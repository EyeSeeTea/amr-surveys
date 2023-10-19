import { ImportStrategy, TrackerEventsPostRequest } from "../../../domain/entities/EventProgram";
import { Future } from "../../../domain/entities/generic/Future";
import { Questionnaire } from "../../../domain/entities/Questionnaire";
import { SurveyRepository } from "../../../domain/repositories/SurveyRepository";
import { FutureData } from "../../api-futures";

export class SurveyTestRepository implements SurveyRepository {
    saveFormData(events: TrackerEventsPostRequest, action: ImportStrategy): FutureData<void> {
        console.debug(events, action);
        throw new Error("Method not implemented.");
    }
    getForm(programId: string): FutureData<Questionnaire> {
        const questionnaire: Questionnaire = {
            id: programId,
            name: "Test Questionnaire",
            description: "Test Questionnaire",
            sections: [
                {
                    code: "s1",
                    isVisible: true,
                    title: "Section1",
                    questions: [],
                },
            ],
            orgUnit: { id: "OU1" },
            isCompleted: false,
            isMandatory: false,
            year: "2023",
            rules: [],
        };
        return Future.success(questionnaire);
    }
}
