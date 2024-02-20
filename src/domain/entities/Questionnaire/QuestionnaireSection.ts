import { Id } from "../Ref";
import { Code, Question, QuestionnaireQuestion } from "./QuestionnaireQuestion";
import { QuestionnaireRule, parseCondition } from "./QuestionnaireRules";

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
    static updateSection(
        section: QuestionnaireSection,
        updatedQuestion: Question,
        questionnaireRules: QuestionnaireRule[]
    ): QuestionnaireSection {
        return {
            ...section,
            isVisible: this.isSectionVisible(section, updatedQuestion, questionnaireRules),
            questions: section.questions.map(question => {
                return QuestionnaireQuestion.updateQuestion(
                    question,
                    updatedQuestion,
                    questionnaireRules
                );
            }),
        };
    }

    static isSectionVisible(
        section: QuestionnaireSection,
        updatedQuestion: Question,
        questionnaireRules: QuestionnaireRule[]
    ): boolean {
        //Check of there are any rules applicable to the current updated question
        //with hide section action
        const applicableRules = questionnaireRules.filter(
            rule =>
                rule.dataElementId === updatedQuestion.id &&
                rule.programRuleActions.filter(
                    action =>
                        action.programRuleActionType === "HIDESECTION" &&
                        action.programStageSection &&
                        action.programStageSection.id === section.code
                ).length > 0
        );
        if (!applicableRules || applicableRules.length === 0) return section.isVisible;

        const updatedSectionVisibility = applicableRules.flatMap(rule => {
            return rule.programRuleActions.flatMap(action => {
                if (action.programRuleActionType === "HIDESECTION") {
                    const hideSection = parseCondition(rule.condition, updatedQuestion);
                    return !hideSection;
                } else return section.isVisible;
            });
        });
        return updatedSectionVisibility.every(Boolean);
    }
}
