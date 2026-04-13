import { AMRSurveyModule, SurveyRule } from "../entities/AMRSurveyModule";
import { Questionnaire } from "../entities/Questionnaire/Questionnaire";
import { Id, NamedRef } from "../entities/Ref";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { Maybe } from "../../utils/ts-utils";

export class ApplyInitialRulesToSurveyUseCase {
    public execute(
        questionnaire: Questionnaire,
        module: Maybe<AMRSurveyModule>,
        currentPPSSurveyForm: Maybe<Id>,
        currentPrevalenceSurveyForm: Maybe<Id>,
        surveyFormType: SURVEY_FORM_TYPES,
        parentCaseReport: Maybe<NamedRef>
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

        return this.processQuestionnaireRules(
            currentFormRule,
            currentSurveyAntibioticBlacklist,
            surveyFormType,
            parentCaseReport,
            questionnaire
        );
    }

    private processQuestionnaireRules(
        currentFormRule: Maybe<SurveyRule>,
        currentSurveyAntibioticBlacklist: Maybe<string[]>,
        surveyFormType: SURVEY_FORM_TYPES,
        parentCaseReport: Maybe<NamedRef>,
        questionnaire: Questionnaire
    ) {
        const steps: ((questionnaireInput: Questionnaire) => Questionnaire)[] = [
            //1. Apply survey rules defined in the datastore
            questionnaire =>
                currentFormRule
                    ? Questionnaire.applySurveyRulesOnQuestionnaireInitialLoad(
                          questionnaire,
                          currentFormRule
                      )
                    : questionnaire,
            //2. Apply antibiotic blacklist rules defined in the datastore
            questionnaire =>
                currentSurveyAntibioticBlacklist
                    ? Questionnaire.applyAntibioticsBlacklist(
                          questionnaire,
                          currentSurveyAntibioticBlacklist
                      )
                    : questionnaire,
            //3. Apply program rules defined in metadata
            questionnaire =>
                Questionnaire.applyProgramRulesOnQuestionnaireInitialLoad(questionnaire),
            //4. Apply unique patient ID rules (required on case report, read-only on sub-forms)
            questionnaire =>
                Questionnaire.applyUniquePatientIdRules(
                    questionnaire,
                    surveyFormType,
                    parentCaseReport
                ),
        ];

        return steps.reduce((q, step) => step(q), questionnaire);
    }
}
