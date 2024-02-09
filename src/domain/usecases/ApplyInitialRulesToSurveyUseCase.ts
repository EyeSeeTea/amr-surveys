import { Questionnaire, QuestionnarieM } from "../entities/Questionnaire";

export class ApplyInitialRulesToSurveyUseCase {
    public execute(questionnaire: Questionnaire): Questionnaire {
        return QuestionnarieM.applyAllRulesOnQuestionnaireInitialLoad(questionnaire);
    }
}
