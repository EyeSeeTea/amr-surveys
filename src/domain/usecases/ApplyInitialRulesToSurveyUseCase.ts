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
        const currentParentId =
            module?.name === "PPS" ? currentPPSSurveyForm : currentPrevalenceSurveyForm;

        const currentSurveyRules = module?.rulesBySurvey?.find(
            rule => rule.surveyId === currentParentId
        )?.surveyRules;

        const currentFormRule = currentSurveyRules?.find(
            surveyRule => surveyRule.formId === questionnaire.id
        );

        const currentSurveyAntibioticBlacklist = module?.rulesBySurvey?.find(
            rule => rule.surveyId === currentParentId
        )?.antibioticBlacklist;

        //1. Apply survey rules defined in the datastore
        const surveyRuleUpdatedQuestionnaire = currentFormRule
            ? Questionnaire.applySurveyRulesOnQuestionnaireInitialLoad(
                  questionnaire,
                  currentFormRule
              )
            : questionnaire;

        //2. Apply antibiotic blacklist rules defined in the datastore
        const antibioticBlacklistUpdatedQuestionnaire = currentSurveyAntibioticBlacklist
            ? Questionnaire.applyAntibioticsBlacklist(
                  surveyRuleUpdatedQuestionnaire,
                  currentSurveyAntibioticBlacklist
              )
            : surveyRuleUpdatedQuestionnaire;

        //3. Apply program rules defined in metadata
        const programRuleUpdatedQuestionnaire =
            Questionnaire.applyProgramRulesOnQuestionnaireInitialLoad(
                antibioticBlacklistUpdatedQuestionnaire
            );

        return programRuleUpdatedQuestionnaire;
    }
}
