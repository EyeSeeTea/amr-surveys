import { FutureData } from "../../data/api-futures";
import {
    AMR_SURVEYS_MORTALITY_TEA_PAT_ID_COH2,
    AMR_SURVEYS_MORTALITY_TEA_PAT_ID_DEC,
    AMR_SURVEYS_MORTALITY_TEA_PAT_ID_DF2,
    AMR_SURVEYS_MORTALITY_TEA_PAT_ID_FUP2,
    AMR_SURVEYS_PREVALENCE_TEA_AMRPATIENT_IDPREVALENCE,
    AMR_SURVEYS_PREVALENCE_TEA_PATIENT_ID,
    AMR_SURVEYS_PREVALENCE_TEA_PATIENT_IDA19,
    AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID,
    SURVEY_ID_DATAELEMENT_ID,
    SURVEY_ID_PATIENT_TEA_ID,
    WARD_ID_TEA_ID,
    parentPrevalenceSurveyIdList,
} from "../../data/entities/D2Survey";
import { isTrackerProgram } from "../../data/utils/surveyProgramHelper";
import { Maybe } from "../../utils/ts-utils";
import { Future } from "../entities/generic/Future";
import {
    Questionnaire,
    QuestionnaireEntity,
    QuestionnaireStage,
} from "../entities/Questionnaire/Questionnaire";
import { Question } from "../entities/Questionnaire/QuestionnaireQuestion";
import { QuestionnaireSection } from "../entities/Questionnaire/QuestionnaireSection";
import { Id, NamedRef } from "../entities/Ref";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { ModuleRepository } from "../repositories/ModuleRepository";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { getDefaultOrCustomProgramId } from "../utils/getDefaultOrCustomProgramId";

export class GetSurveyUseCase {
    constructor(
        private surveyReporsitory: SurveyRepository,
        private moduleRepository: ModuleRepository
    ) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        parentPPSSurveyId: Maybe<Id>,
        parentWardRegisterId: Maybe<Id>,
        parentPrevalenceSurveyId: Maybe<Id>,
        parentCaseReport: Maybe<NamedRef>
    ): FutureData<Questionnaire> {
        return getDefaultOrCustomProgramId(
            this.moduleRepository,
            surveyFormType,
            parentPrevalenceSurveyId
        ).flatMap(programId => {
            if (parentPPSSurveyId) {
                return this.getPPSSurveyForm(programId, parentPPSSurveyId, parentWardRegisterId);
            } else if (parentPrevalenceSurveyId) {
                return this.getPrevalenceSurveyForm(
                    programId,
                    parentPrevalenceSurveyId,
                    parentCaseReport
                );
            } else return this.surveyReporsitory.getForm(programId, undefined, undefined);
        });
    }

    getPPSSurveyForm(
        programId: Id,
        parentPPSSurveyId: Maybe<Id>,
        parentWardRegisterId: Maybe<Id>
    ): FutureData<Questionnaire> {
        return Future.joinObj({
            modules: this.moduleRepository.getAll(),
            questionnaire: this.surveyReporsitory.getForm(programId, undefined, undefined),
        }).flatMap(({ modules, questionnaire }) => {
            if (isTrackerProgram(programId, modules) && questionnaire.entity) {
                const updatedEntityQuestions: Question[] = questionnaire.entity.questions.map(
                    question => {
                        if (
                            question.id === WARD_ID_TEA_ID &&
                            parentWardRegisterId &&
                            question.type === "text"
                        ) {
                            return {
                                ...question,
                                value: parentWardRegisterId,
                            };
                        } else if (
                            question.id === SURVEY_ID_PATIENT_TEA_ID &&
                            question.type === "text" &&
                            parentPPSSurveyId
                        ) {
                            return {
                                ...question,
                                value: parentPPSSurveyId,
                            };
                        } else return question;
                    }
                );

                const updatedEntity: QuestionnaireEntity = {
                    ...questionnaire.entity,
                    questions: updatedEntityQuestions,
                };

                return Future.success(
                    Questionnaire.updateQuestionnaireEntity(questionnaire, updatedEntity)
                );
            } else if (questionnaire.stages && questionnaire.stages[0]) {
                const updatedSections: QuestionnaireSection[] =
                    questionnaire.stages[0].sections.map(section => {
                        //PPS Event Program Questionnaires have only 1 stage
                        const isSurveyIdSection =
                            section.questions.find(
                                question => question.id === SURVEY_ID_DATAELEMENT_ID
                            ) !== undefined;

                        if (isSurveyIdSection) {
                            const updatedQuestions: Question[] = section.questions.map(question => {
                                const isSurveyIdQuestion = question.id === SURVEY_ID_DATAELEMENT_ID;

                                if (isSurveyIdQuestion && question.type === "text") {
                                    //Survey Id Question, pre-populate value to parent survey id
                                    const updatedSurveyIdQuestion: Question = {
                                        ...question,
                                        value: parentPPSSurveyId,
                                    };
                                    return updatedSurveyIdQuestion;
                                } else {
                                    //Not survey id question, return without any update
                                    return question;
                                }
                            });

                            return {
                                ...section,
                                questions: updatedQuestions,
                            };
                        }

                        //Not survey id section, return without any update
                        return section;
                    });

                const updatedStage: QuestionnaireStage = {
                    ...questionnaire.stages[0],
                    sections: updatedSections,
                };

                const updatedStages = questionnaire.stages.map(stage =>
                    stage.id === updatedStage.id ? updatedStage : stage
                );

                return Future.success(
                    Questionnaire.updateQuestionnaireStages(questionnaire, updatedStages)
                );
            } else {
                return Future.success(questionnaire);
            }
        });
    }

    getPrevalenceSurveyForm(
        programId: Id,
        parentPrevalenceSurveyId: Id,
        parentCaseReport: Maybe<NamedRef>
    ): FutureData<Questionnaire> {
        return this.surveyReporsitory
            .getForm(programId, undefined, undefined)
            .flatMap(questionnaire => {
                //The Survey Id is always part of Tracked Entity which is the Profile Section i.e questionnaire.entity

                if (!questionnaire.entity) {
                    return Future.success(questionnaire);
                }
                const updatedEntityQuestions: Question[] = questionnaire.entity.questions.map(
                    question => {
                        const isSurveyIdQuestion = parentPrevalenceSurveyIdList.includes(
                            question.id
                        );
                        // TODO: check if patientIdList can be used (it includes more IDs than these)
                        const isPatientIdQuestion =
                            question.id === AMR_SURVEYS_PREVALENCE_TEA_PATIENT_ID ||
                            question.id === AMR_SURVEYS_PREVALENCE_TEA_AMRPATIENT_IDPREVALENCE ||
                            question.id === AMR_SURVEYS_PREVALENCE_TEA_PATIENT_IDA19 ||
                            question.id === AMR_SURVEYS_MORTALITY_TEA_PAT_ID_FUP2 ||
                            question.id === AMR_SURVEYS_MORTALITY_TEA_PAT_ID_DF2 ||
                            question.id === AMR_SURVEYS_MORTALITY_TEA_PAT_ID_DEC ||
                            question.id === AMR_SURVEYS_MORTALITY_TEA_PAT_ID_COH2;

                        const isUniquePatientIdQuestion =
                            question.id === AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID;

                        if (isSurveyIdQuestion && question.type === "text") {
                            return {
                                ...question,
                                value: parentPrevalenceSurveyId,
                            };
                        } else if (isPatientIdQuestion && question.type === "text") {
                            return {
                                ...question,
                                value: parentCaseReport?.id,
                            };
                        } else if (isUniquePatientIdQuestion && question.type === "text") {
                            // Only set value and disable if inheriting from parent case report
                            // For new PrevalenceCaseReportForm, leave editable so user can enter it
                            if (parentCaseReport?.name) {
                                return {
                                    ...question,
                                    value: parentCaseReport.name,
                                    disabled: true,
                                };
                            }
                            return question;
                        } else {
                            return question;
                        }
                    }
                );

                const updatedEntity: QuestionnaireEntity = {
                    ...questionnaire.entity,
                    questions: updatedEntityQuestions,
                };

                return Future.success(
                    Questionnaire.updateQuestionnaireEntity(questionnaire, updatedEntity)
                );
            });
    }
}
