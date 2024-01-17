import { Questionnaire, QuestionnarieM } from "../entities/Questionnaire";

export class ApplyInitialRulesToSurveyUseCase {
    public execute(questionnaire: Questionnaire): Questionnaire {
        const processedQuestionnaire =
            QuestionnarieM.applyAllRulesOnQuestionnaireInitialLoad(questionnaire);
        return processedQuestionnaire;
    }
}
