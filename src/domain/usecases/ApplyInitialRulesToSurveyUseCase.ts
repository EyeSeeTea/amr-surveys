import { Questionnaire, QuestionnaireM } from "../entities/Questionnaire/Questionnaire";

export class ApplyInitialRulesToSurveyUseCase {
    public execute(questionnaire: Questionnaire): Questionnaire {
        return QuestionnaireM.applyAllRulesOnQuestionnaireInitialLoad(questionnaire);
    }
}
