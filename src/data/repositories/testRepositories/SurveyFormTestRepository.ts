import { Future } from "../../../domain/entities/generic/Future";
import { Questionnaire } from "../../../domain/entities/Questionnaire";
import { SurveyFormRepository } from "../../../domain/repositories/SurveyFormRepository";
import { FutureData } from "../../api-futures";

export class SurveyFormTestRepository implements SurveyFormRepository {
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
