import { generateUid } from "../../../utils/uid";
import { SurveyRule } from "../AMRSurveyModule";
import { Id, Ref } from "../Ref";
import _ from "../generic/Collection";
import { Code, Question } from "./QuestionnaireQuestion";
import { QuestionnaireRule, getApplicableRules } from "./QuestionnaireRules";
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

interface QuestionnaireData extends QuestionnaireBase {
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
    id: Id;
    title: string;
    code: Code;
    sections: QuestionnaireSection[];
    sortOrder: number;
    isVisible: boolean;
    repeatable: boolean;
    showNextStage?: boolean;
    instanceId?: Id; //Corresponds to DHIS eventId
    isAddedByUser?: boolean;
}

export class Questionnaire {
    private readonly data: QuestionnaireData;

    private constructor(data: QuestionnaireData) {
        this.data = data;
    }

    public get id(): Id {
        return this.data.id;
    }
    public get stages(): QuestionnaireStage[] {
        return this.data.stages;
    }
    public get rules(): QuestionnaireRule[] {
        return this.data.rules;
    }
    public get entity(): QuestionnaireEntity | undefined {
        return this.data.entity;
    }
    public get orgUnit(): Ref {
        return this.data.orgUnit;
    }

    public get subLevelDetails(): { enrollmentId: Id } | undefined {
        return this.data.subLevelDetails;
    }

    public static create(data: QuestionnaireData): Questionnaire {
        //TO DO : Add validations if any
        return new Questionnaire({
            id: data.id,
            name: data.name,
            description: data.description,
            orgUnit: data.orgUnit,
            year: data.year,
            isCompleted: data.isCompleted,
            isMandatory: data.isMandatory,
            stages: data.stages,
            entity: data.entity,
            subLevelDetails: data.subLevelDetails,
            rules: data.rules,
        });
    }

    static updateQuestionnaireEntity(
        questionnaire: Questionnaire,
        entity: QuestionnaireEntity
    ): Questionnaire {
        return Questionnaire.create({
            ...questionnaire.data,
            entity: entity,
        });
    }

    static updateQuestionnaireStages(
        questionnaire: Questionnaire,
        stages: QuestionnaireStage[]
    ): Questionnaire {
        return Questionnaire.create({
            ...questionnaire.data,
            stages: stages,
        });
    }

    static setAsComplete(questionnarie: Questionnaire, value: boolean): Questionnaire {
        return Questionnaire.create({
            ...questionnarie.data,
            isCompleted: value,
        });
    }

    static applyProgramRulesOnQuestionnaireInitialLoad(
        questionnaire: Questionnaire
    ): Questionnaire {
        try {
            if (!questionnaire.rules || questionnaire.rules.length === 0) return questionnaire;

            const allQsInQuestionnaire: Question[] = questionnaire.stages.flatMap(stage => {
                return stage.sections.flatMap(section => {
                    return section.questions.map(question => {
                        return { ...question, stageId: stage.id };
                    });
                });
            });

            const updatedQuestionnaire = allQsInQuestionnaire.reduce(
                (questionnaireAcc, question) => {
                    return this.updateQuestionnaire(questionnaireAcc, question, question.stageId);
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

    static applySurveyRulesOnQuestionnaireInitialLoad(
        questionnaire: Questionnaire,
        surveyRule: SurveyRule
    ): Questionnaire {
        if (surveyRule.rules.length === 0) return questionnaire;

        const updatedStages = questionnaire.stages.map(stage => {
            return {
                ...stage,
                sections: stage.sections.map(section => {
                    const currentSectionRule = surveyRule.rules.find(rule =>
                        rule.toHide?.find(de => de === section.code)
                    );

                    const sectionVisibility =
                        currentSectionRule && currentSectionRule.type === "HIDESECTION"
                            ? false
                            : true;

                    return {
                        ...section,
                        isVisible: sectionVisibility,
                        questions: section.questions.map(question => {
                            const currentQuestionRule = surveyRule.rules.find(rule =>
                                rule.toHide?.find(de => de === question.id)
                            );
                            if (currentQuestionRule && currentQuestionRule.type === "HIDEFIELD") {
                                return {
                                    ...question,
                                    isVisible: false,
                                };
                            } else return question;
                        }),
                    };
                }),
            };
        });
        const updatedQuestionnaire = Questionnaire.updateQuestionnaireStages(
            questionnaire,
            updatedStages
        );

        return updatedQuestionnaire;
    }

    static updateQuestionnaire(
        questionnaire: Questionnaire,
        updatedQuestion: Question,
        stageId?: string
    ): Questionnaire {
        //For the updated question, get all rules that are applicable
        const allQsInQuestionnaire = questionnaire.stages.flatMap((stage: QuestionnaireStage) => {
            return stage.sections.flatMap(section => {
                return section.questions.map(question => question);
            });
        });

        const applicableRules = getApplicableRules(
            updatedQuestion,
            questionnaire.rules,
            allQsInQuestionnaire
        );

        return Questionnaire.create({
            ...questionnaire.data,
            stages: questionnaire.stages.map(stage => {
                if (stageId && stage.id !== stageId) return stage;
                return {
                    ...stage,
                    sections: QuestionnaireSectionM.updatedSections(
                        stage.sections,
                        updatedQuestion,
                        questionnaire,
                        applicableRules
                    ),
                };
            }),
        });
    }

    static doesQuestionnaireHaveErrors(questionnaire: Questionnaire): boolean {
        const allQuestions = questionnaire.stages.flatMap(stage => {
            return stage.sections.flatMap(section => {
                return section.questions.map(question => question);
            });
        });

        return allQuestions.some(question => question.errors.length > 0);
    }

    static addProgramStage(questionnaire: Questionnaire, stageCode: Id): Questionnaire {
        const stageToAdd = questionnaire.stages.find(stage => stage.code === stageCode);
        if (!stageToAdd) return questionnaire;

        const addEmptySectionWithEmptyQuestions = (
            section: QuestionnaireSection
        ): QuestionnaireSection => {
            return {
                ...section,
                questions: section.questions.map(question => {
                    return {
                        ...question,
                        value: undefined,
                        errors: [],
                    };
                }),
            };
        };

        const newStage: QuestionnaireStage = {
            id: generateUid(),
            title: stageToAdd.title,
            code: stageToAdd.code,
            sections: stageToAdd.sections.map(section =>
                addEmptySectionWithEmptyQuestions(section)
            ),
            sortOrder: questionnaire.stages.length,
            isVisible: stageToAdd.isVisible,
            repeatable: stageToAdd.repeatable,
            isAddedByUser: true,
        };

        return Questionnaire.updateQuestionnaireStages(questionnaire, [
            ...questionnaire.stages,
            newStage,
        ]);
    }

    static removeProgramStage(questionnaire: Questionnaire, stageId: Id): Questionnaire {
        const updatedStages = questionnaire.stages.filter(stage => stage.id !== stageId);
        return Questionnaire.updateQuestionnaireStages(questionnaire, updatedStages);
    }
}
