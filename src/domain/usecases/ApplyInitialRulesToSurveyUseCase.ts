import { AMRSurveyModule } from "../entities/AMRSurveyModule";
import { Questionnaire } from "../entities/Questionnaire/Questionnaire";

import { Id } from "../entities/Ref";

export class ApplyInitialRulesToSurveyUseCase {
    public execute(
        questionnaire: Questionnaire,
        module: AMRSurveyModule | undefined,
        currentPPSSurveyForm: Id | undefined,
        currentPrevalenceSurveyForm: Id | undefined
    ): Questionnaire {
        //1. Apply program rules defined in metadata
        const questionnaireWithProgramRules =
            Questionnaire.applyProgramRulesOnQuestionnaireInitialLoad(questionnaire);

        //2. Apply survey rules defined in the datastore

        const currentParentId =
            module?.name === "PPS" ? currentPPSSurveyForm : currentPrevalenceSurveyForm;

        const currentSurveyRules = module?.rulesBySurvey.find(
            rule => rule.surveyId === currentParentId
        )?.surveyRules;

        const currentFormRule = currentSurveyRules?.find(
            surveyRule => surveyRule.formId === questionnaire.id
        );

        //no rules to apply, return questionnaire with program rules
        if (!currentFormRule) return questionnaireWithProgramRules;
        else {
            const questionnaireWithSurveyRules =
                Questionnaire.applySurveyRulesOnQuestionnaireInitialLoad(
                    questionnaire,
                    currentFormRule
                );
            return questionnaireWithSurveyRules;
        }
    }
}
