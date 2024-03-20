import { Questionnaire } from "../entities/Questionnaire/Questionnaire";

export class ApplyInitialRulesToSurveyUseCase {
    public execute(questionnaire: Questionnaire): Questionnaire {
        return Questionnaire.applyAllRulesOnQuestionnaireInitialLoad(questionnaire);
    }
}
