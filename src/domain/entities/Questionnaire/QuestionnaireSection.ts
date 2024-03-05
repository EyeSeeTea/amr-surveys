import { Id } from "../Ref";
import { Questionnaire } from "./Questionnaire";
import { Code, Question, QuestionnaireQuestion } from "./QuestionnaireQuestion";
import { QuestionnaireRule } from "./QuestionnaireRules";
import _ from "../generic/Collection";

export interface QuestionnaireSection {
    title: string;
    code: Code;
    questions: Question[];
    isVisible: boolean;
    sortOrder: number;
    stageId: string;
    showAddnew?: boolean;
    showAddQuestion?: Id;
}

export class QuestionnaireSectionM {
    static updatedSections(
        sections: QuestionnaireSection[],
        updatedQuestion: Question,
        questionnaire: Questionnaire,
        rules: QuestionnaireRule[]
    ): QuestionnaireSection[] {
        //Get all the sections that require update
        const allSectionsRequiringUpdate = _(
            rules.flatMap(rule => {
                return rule.actions.flatMap(action => action.programStageSection?.id);
            })
        )
            .compact()
            .value();

        const updatedSections = sections.map(section => {
            //If the section is part of any of the rule actions, update the section
            const updatedSection = allSectionsRequiringUpdate.includes(section.code)
                ? this.updateSection(section, rules)
                : section;

            return {
                ...updatedSection,
                questions: QuestionnaireQuestion.updateQuestions(
                    updatedSection.questions,
                    updatedQuestion,
                    rules,
                    questionnaire
                ),
            };
        });

        return updatedSections;
    }

    static updateSection(
        section: QuestionnaireSection,
        rules: QuestionnaireRule[]
    ): QuestionnaireSection {
        //If any more section specific rules are added, they can be handled here
        return {
            ...section,
            isVisible: this.isSectionVisible(section, rules),
        };
    }

    static isSectionVisible(section: QuestionnaireSection, rules: QuestionnaireRule[]): boolean {
        //Check of there are any rules applicable to the current section
        //with hide section action
        const applicableRules = rules.filter(
            rule =>
                rule.actions.filter(
                    action =>
                        action.programRuleActionType === "HIDESECTION" &&
                        action.programStageSection &&
                        action.programStageSection.id === section.code
                ).length > 0
        );
        if (!applicableRules || applicableRules.length === 0) return section.isVisible;

        const updatedSectionVisibility = applicableRules.flatMap(rule => {
            return rule.actions.flatMap(action => {
                if (action.programRuleActionType === "HIDESECTION") {
                    if (rule.parsedResult === true) return false;
                    else return true;
                } else return section.isVisible;
            });
        });

        //If even one of the rules asks to hide the section, hide the section
        return updatedSectionVisibility.some(visibility => visibility === false) ? false : true;
    }
}
