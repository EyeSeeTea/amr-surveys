import { Questionnaire, QuestionnarieM } from "../entities/Questionnaire/Questionnaire";

export class ApplyInitialRulesToSurveyUseCase {
    public execute(questionnaire: Questionnaire): Questionnaire {
        return QuestionnarieM.applyAllRulesOnQuestionnaireInitialLoad(questionnaire);
    }
}
