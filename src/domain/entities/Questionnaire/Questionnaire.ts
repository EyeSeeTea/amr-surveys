import { Id, Ref } from "../Ref";
import _ from "../generic/Collection";
import { Code, Question } from "./QuestionnaireQuestion";
import { QuestionnaireRule } from "./QuestionnaireRules";
import { QuestionnaireSection, QuestionnaireSectionM } from "./QuestionnaireSection";

export interface QuestionnaireBase {
    id: Id;
    name: string;
    description: string;
    orgUnit: Ref;
    year: string;
    isCompleted: boolean;
    isMandatory: boolean;
}

export interface Questionnaire extends QuestionnaireBase {
    stages: QuestionnaireStage[];
    entity?: QuestionnaireEntity; //Equivalant to tracked entity instance of tracker program
    subLevelDetails?: {
        enrollmentId: Id;
    };
    rules: QuestionnaireRule[];
}

export interface QuestionnaireEntity {
    title: string;
    code: string;
    questions: Question[];
    isVisible: boolean;
    stageId: string;
}

export interface QuestionnaireStage {
    title: string;
    code: Code;
    sections: QuestionnaireSection[];
    isVisible: boolean;
    showNextStage?: boolean;
    instanceId?: Id; //Corresponds to DHIS eventId
}

export class QuestionnarieM {
    static setAsComplete(questionnarie: Questionnaire, value: boolean): Questionnaire {
        return { ...questionnarie, isCompleted: value };
    }

    static applyAllRulesOnQuestionnaireInitialLoad(questionnaire: Questionnaire): Questionnaire {
        try {
            if (!questionnaire.rules || questionnaire.rules.length === 0) return questionnaire;

            const allQsInQuestionnaire: Question[] = questionnaire.stages.flatMap(stage => {
                return stage.sections.flatMap(section => {
                    return section.questions.map(question => question);
                });
            });

            const updatedQuestionnaire = allQsInQuestionnaire.reduce(
                (questionnaireAcc, question) => {
                    return this.updateQuestionnaire(questionnaireAcc, question);
                },
                questionnaire
            );

            return updatedQuestionnaire;
        } catch (err) {
            //An error occured while parsing rules, return questionnaire as is.
            console.debug(err);
            return questionnaire;
        }
    }

    static updateQuestionnaire(
        questionnaire: Questionnaire,
        updatedQuestion: Question
    ): Questionnaire {
        return {
            ...questionnaire,
            stages: questionnaire.stages.map(stage => {
                return {
                    ...stage,
                    sections: stage.sections.map(section => {
                        return QuestionnaireSectionM.updateSection(
                            section,
                            updatedQuestion,
                            questionnaire.rules
                        );
                    }),
                };
            }),
        };
    }
}
