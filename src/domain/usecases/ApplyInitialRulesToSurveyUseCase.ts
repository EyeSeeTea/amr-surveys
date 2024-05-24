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
        let updatedQuestionnaire: Questionnaire;
        //1. Apply program rules defined in metadata
        updatedQuestionnaire =
            Questionnaire.applyProgramRulesOnQuestionnaireInitialLoad(questionnaire);

        //2. Apply survey rules defined in the datastore

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

        if (currentFormRule) {
            updatedQuestionnaire = Questionnaire.applySurveyRulesOnQuestionnaireInitialLoad(
                updatedQuestionnaire,
                currentFormRule
            );
        }

        if (currentSurveyAntibioticBlacklist) {
            updatedQuestionnaire = Questionnaire.applyAntibioticsBlacklist(
                updatedQuestionnaire,
                currentSurveyAntibioticBlacklist
            );
        }

        return updatedQuestionnaire;
    }
}
