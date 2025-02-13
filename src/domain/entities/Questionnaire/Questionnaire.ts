import { generateUid } from "../../../utils/uid";
import { SurveyRule } from "../AMRSurveyModule";
import { Id, Ref } from "../Ref";
import _ from "../generic/Collection";
import {
    Code,
    Question,
    QuestionnaireQuestion,
    isAntibioticQuestion,
} from "./QuestionnaireQuestion";
import { getApplicableRules, QuestionnaireRule } from "./QuestionnaireRules";
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
    subTitle?: string;
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

    /** Returns all questions, including entity questions and stage questions */
    getAllQuestions(): Question[] {
        const stageQuestions = this.stages.flatMap((stage: QuestionnaireStage) => {
            return stage.sections.flatMap(section => {
                return section.questions.map(question => question);
            });
        });
        const entityQuestions = this.entity?.questions || [];
        return [...stageQuestions, ...entityQuestions];
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

    static updateQuestionnaireSections(
        questionnaire: Questionnaire,
        stageId: Id,
        stageToUpdate: QuestionnaireStage,
        updatedSections: QuestionnaireSection[]
    ): Questionnaire {
        return Questionnaire.updateQuestionnaireStages(
            questionnaire,
            questionnaire.stages.map(stage => {
                if (stage.id === stageId)
                    return {
                        ...stageToUpdate,
                        sections: updatedSections,
                    };
                else return stage;
            })
        );
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

            const allQsInQuestionnaireStages: Question[] = questionnaire.stages.flatMap(stage => {
                return stage.sections.flatMap(section => {
                    return section.questions.map(question => {
                        return { ...question, stageId: stage.id };
                    });
                });
            });

            const allQsInQuestionnaire = [
                ...(questionnaire.entity?.questions || []),
                ...allQsInQuestionnaireStages,
            ];

            const updatedQuestionnaire = allQsInQuestionnaire.reduce(
                (questionnaireAcc, question) => {
                    return this.updateQuestionnaire(
                        questionnaireAcc,
                        question,
                        question.stageId,
                        true
                    );
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
                isVisible: !surveyRule.rules.find(rule =>
                    rule.toHide?.find(ruleStage => ruleStage === stage.id)
                ),
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

        const updatedQuestionnaire: Questionnaire = Questionnaire.updateQuestionnaireStages(
            questionnaire,
            updatedStages
        );

        const hideEntityQuestionRule = surveyRule.rules.find(
            rule =>
                rule.type === "HIDEFIELD" &&
                rule.toHide.find(id =>
                    updatedQuestionnaire.entity?.questions.find(q => q.id === id)
                )
        );
        if (hideEntityQuestionRule && questionnaire.entity) {
            const updatedEntityQuestions: Question[] = questionnaire.entity.questions.map(
                question => {
                    return {
                        ...question,
                        isVisible: hideEntityQuestionRule.toHide.find(id => id === question.id)
                            ? false
                            : true,
                    };
                }
            );

            const updatedEntity = { ...questionnaire.entity, questions: updatedEntityQuestions };
            return Questionnaire.updateQuestionnaireEntity(updatedQuestionnaire, updatedEntity);
        }

        return updatedQuestionnaire;
    }

    static updateQuestionnaire(
        questionnaire: Questionnaire,
        updatedQuestion: Question,
        stageId?: string,
        initialLoad = false,
        alreadyUpdatedQuestions?: undefined | Question[]
    ): Questionnaire {
        //For the updated question, get all rules that are applicable
        const allQsInQuestionnaire = questionnaire.getAllQuestions();

        const allQsInQuestionnaireWithUpdatedQ = allQsInQuestionnaire.map(question =>
            question.id === updatedQuestion.id ? updatedQuestion : question
        );

        const applicableRules = getApplicableRules(
            updatedQuestion,
            questionnaire.rules,
            allQsInQuestionnaireWithUpdatedQ
        );

        if (initialLoad && applicableRules.length === 0) return questionnaire;

        const isEntityQuestionUpdated = questionnaire.entity?.questions.find(
            question => question.id === updatedQuestion.id
        );

        // "assign" actions may cause cascading updates
        const assignRuleTargets: Question[] =
            QuestionnaireQuestion.filterQuestionsTargettedByAssign(
                allQsInQuestionnaireWithUpdatedQ,
                applicableRules
            )
                // we don't want to update questions already updated to prevent infinite recursion
                .filter(
                    question =>
                        question && !alreadyUpdatedQuestions?.some(uq => uq.id === question.id)
                );

        const updatedQuestionnaire = Questionnaire.create({
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
            entity:
                isEntityQuestionUpdated && questionnaire.entity
                    ? this.updateEntityQuestion(
                          questionnaire.entity,
                          updatedQuestion,
                          questionnaire,
                          applicableRules
                      )
                    : questionnaire.entity,
        });

        if (assignRuleTargets.length > 0) {
            // We need to update the questionnaire again based on updates from "assign" actions
            const updatedQuestionnaireWithAssigns = assignRuleTargets.reduce(
                (accQuestionnaire, question) => {
                    const updatedAssignQuestion = QuestionnaireQuestion.updateQuestion(
                        question,
                        applicableRules
                    );
                    return this.updateQuestionnaire(
                        accQuestionnaire,
                        updatedAssignQuestion,
                        stageId,
                        initialLoad,
                        [...(alreadyUpdatedQuestions ?? []), updatedAssignQuestion]
                    );
                },
                updatedQuestionnaire
            );

            return updatedQuestionnaireWithAssigns;
        }
        return updatedQuestionnaire;
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

    static updateEntityQuestion(
        questionnaireEntity: QuestionnaireEntity,
        updatedQuestion: Question,
        questionnaire: Questionnaire,
        rules: QuestionnaireRule[]
    ): QuestionnaireEntity | undefined {
        const updatedEntityQuestions = QuestionnaireQuestion.updateQuestions({
            processedQuestions: [],
            questions: questionnaireEntity.questions,
            updatedQuestion: updatedQuestion,
            rules: rules,
            questionnaire: questionnaire,
        });

        return {
            ...questionnaireEntity,
            questions: updatedEntityQuestions,
        };
    }

    static applyAntibioticsBlacklist(
        questionnaire: Questionnaire,
        antibioticsBlacklist: string[]
    ): Questionnaire {
        const updatedStages = questionnaire.stages.map(stage => {
            return {
                ...stage,
                sections: stage.sections.map(section => {
                    return {
                        ...section,
                        questions: section.questions.map(question => {
                            if (isAntibioticQuestion(question)) {
                                const options = question.options.filter(
                                    option =>
                                        !antibioticsBlacklist.some(blacklist =>
                                            option.name
                                                .toLowerCase()
                                                .includes(blacklist.toLowerCase())
                                        )
                                );

                                return {
                                    ...question,
                                    options: options,
                                };
                            } else {
                                if (
                                    antibioticsBlacklist.some(blacklist =>
                                        question.text
                                            .toLowerCase()
                                            .includes(blacklist.toLowerCase())
                                    )
                                ) {
                                    return {
                                        ...question,
                                        isVisible: false,
                                    };
                                } else return question;
                            }
                        }),
                    };
                }),
            };
        });

        return Questionnaire.updateQuestionnaireStages(questionnaire, updatedStages);
    }
}
