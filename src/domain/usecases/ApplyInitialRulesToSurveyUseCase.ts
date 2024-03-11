import { SurveyRule } from "../entities/AMRSurveyModule";
import { Questionnaire, QuestionnarieM } from "../entities/Questionnaire/Questionnaire";

export class ApplyInitialRulesToSurveyUseCase {
    public execute(questionnaire: Questionnaire, surveyRules: SurveyRule[]): Questionnaire {
        //1. Apply program rules defined in metadata
        const questionnaireWithProgramRules =
            QuestionnarieM.applyProgramRulesOnQuestionnaireInitialLoad(questionnaire);

        //2. Apply survey rules defined in the datastore
        const currentSurveyRules = surveyRules.find(
            surveyRule => surveyRule.surveyId === questionnaire.id
        );

        //no rules to apply, return questionnaire with program rules
        if (!currentSurveyRules) return questionnaireWithProgramRules;
        else {
            const questionnaireWithSurveyRules =
                QuestionnarieM.applySurveyRulesOnQuestionnaireInitialLoad(
                    questionnaire,
                    currentSurveyRules
                );
            return questionnaireWithSurveyRules;
        }
    }
}
