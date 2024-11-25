import { FutureData } from "../../data/api-futures";
import {
    AMR_SURVEYS_MORTALITY_TEA_PAT_ID_COH2,
    AMR_SURVEYS_MORTALITY_TEA_PAT_ID_DF2,
    AMR_SURVEYS_MORTALITY_TEA_PAT_ID_FUP2,
    AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_COH,
    AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_DF,
    AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_FUP,
    AMR_SURVEYS_PREVALENCE_TEA_AMRPATIENT_IDPREVALENCE,
    AMR_SURVEYS_PREVALENCE_TEA_PATIENT_ID,
    AMR_SURVEYS_PREVALENCE_TEA_PATIENT_IDA19,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF,
    SURVEY_ID_DATAELEMENT_ID,
    SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID,
    SURVEY_ID_PATIENT_TEA_ID,
    WARD_ID_TEA_ID,
} from "../../data/entities/D2Survey";
import { isTrackerProgram } from "../../data/utils/surveyProgramHelper";
import { Future } from "../entities/generic/Future";
import {
    Questionnaire,
    QuestionnaireEntity,
    QuestionnaireStage,
} from "../entities/Questionnaire/Questionnaire";
import { Question } from "../entities/Questionnaire/QuestionnaireQuestion";
import { QuestionnaireSection } from "../entities/Questionnaire/QuestionnaireSection";
import { Id } from "../entities/Ref";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";

export class GetSurveyUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        parentPPSSurveyId: Id | undefined,
        parentWardRegisterId: Id | undefined,
        parentPrevalenceSurveyId: Id | undefined,
        parentCaseReportId: Id | undefined
    ): FutureData<Questionnaire> {
        const programId = getProgramId(surveyFormType);
        if (parentPPSSurveyId) {
            return this.getPPSSurveyForm(programId, parentPPSSurveyId, parentWardRegisterId);
        } else if (parentPrevalenceSurveyId) {
            return this.getPrevalenceSurveyForm(
                programId,
                parentPrevalenceSurveyId,
                parentCaseReportId
            );
        } else return this.surveyReporsitory.getForm(programId, undefined, undefined);
    }

    getPPSSurveyForm(
        programId: Id,
        parentPPSSurveyId: Id | undefined,
        parentWardRegisterId: Id | undefined
    ): FutureData<Questionnaire> {
        return this.surveyReporsitory
            .getForm(programId, undefined, undefined)
            .flatMap(questionnaire => {
                if (isTrackerProgram(programId) && questionnaire.entity) {
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
                                const updatedQuestions: Question[] = section.questions.map(
                                    question => {
                                        const isSurveyIdQuestion =
                                            question.id === SURVEY_ID_DATAELEMENT_ID;

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
                                    }
                                );

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

                    return Future.success(
                        Questionnaire.updateQuestionnaireStages(questionnaire, [
                            ...questionnaire.stages,
                            updatedStage,
                        ])
                    );
                } else {
                    return Future.success(questionnaire);
                }
            });
    }

    getPrevalenceSurveyForm(
        programId: Id,
        parentPrevalenceSurveyId: Id,
        parentCaseReportId: Id | undefined
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
                        const isSurveyIdQuestion =
                            question.id === SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID ||
                            question.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF ||
                            question.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL ||
                            question.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS ||
                            question.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL ||
                            question.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF ||
                            question.id === AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_FUP ||
                            question.id === AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_DF ||
                            question.id === AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_COH;

                        const isPatientIdQuestion =
                            question.id === AMR_SURVEYS_PREVALENCE_TEA_PATIENT_ID ||
                            question.id === AMR_SURVEYS_PREVALENCE_TEA_AMRPATIENT_IDPREVALENCE ||
                            question.id === AMR_SURVEYS_PREVALENCE_TEA_PATIENT_IDA19 ||
                            question.id === AMR_SURVEYS_MORTALITY_TEA_PAT_ID_FUP2 ||
                            question.id === AMR_SURVEYS_MORTALITY_TEA_PAT_ID_DF2 ||
                            question.id === AMR_SURVEYS_MORTALITY_TEA_PAT_ID_COH2;

                        if (isSurveyIdQuestion && question.type === "text") {
                            return {
                                ...question,
                                value: parentPrevalenceSurveyId,
                            };
                        } else if (isPatientIdQuestion && question.type === "text") {
                            return {
                                ...question,
                                value: parentCaseReportId,
                            };
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
