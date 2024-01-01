import { FutureData } from "../../data/api-futures";
import {
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF,
    SURVEY_ID_DATAELEMENT_ID,
    SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID,
    SURVEY_ID_PATIENT_DATAELEMENT_ID,
    WARD_ID_DATAELEMENT_ID,
} from "../../data/repositories/SurveyFormD2Repository";
import { Future } from "../entities/generic/Future";
import {
    Question,
    Questionnaire,
    QuestionnaireEntity,
    QuestionnaireSection,
    QuestionnaireStage,
} from "../entities/Questionnaire";
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
        parentPrevalenceSurveyId: Id | undefined
    ): FutureData<Questionnaire> {
        const programId = getProgramId(surveyFormType);
        if (parentPPSSurveyId) {
            return this.surveyReporsitory
                .getForm(programId, undefined, undefined)
                .flatMap(questionnaire => {
                    if (questionnaire.stages && questionnaire.stages[0]) {
                        const updatedSections: QuestionnaireSection[] =
                            questionnaire.stages[0].sections.map(section => {
                                //PPS Questionnaires have only 1 stage
                                const isSurveyIdOrWardIdSection =
                                    section.questions.find(
                                        question =>
                                            question.id === SURVEY_ID_DATAELEMENT_ID ||
                                            question.id === SURVEY_ID_PATIENT_DATAELEMENT_ID ||
                                            question.id === WARD_ID_DATAELEMENT_ID
                                    ) !== undefined;

                                if (isSurveyIdOrWardIdSection) {
                                    const updatedQuestions: Question[] = section.questions.map(
                                        question => {
                                            const isSurveyIdQuestion =
                                                question.id === SURVEY_ID_DATAELEMENT_ID ||
                                                question.id === SURVEY_ID_PATIENT_DATAELEMENT_ID;
                                            const isWardIdQuestion =
                                                question.id === WARD_ID_DATAELEMENT_ID;

                                            if (isSurveyIdQuestion && question.type === "text") {
                                                //Survey Id Question, pre-populate value to parent survey id
                                                const updatedSurveyIdQuestion: Question = {
                                                    ...question,
                                                    value: parentPPSSurveyId,
                                                };
                                                return updatedSurveyIdQuestion;
                                            } else if (
                                                isWardIdQuestion &&
                                                question.type === "text"
                                            ) {
                                                //Survey Id Question, pre-populate value to parent survey id
                                                const updatedWardIdQuestion: Question = {
                                                    ...question,
                                                    value: parentWardRegisterId,
                                                };
                                                return updatedWardIdQuestion;
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

                        return Future.success({ ...questionnaire, stages: [updatedStage] });
                    } else {
                        return Future.success(questionnaire);
                    }
                });
        } else if (parentPrevalenceSurveyId) {
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
                                question.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF;

                            if (isSurveyIdQuestion && question.type === "text") {
                                return {
                                    ...question,
                                    value: parentPrevalenceSurveyId,
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

                    return Future.success({
                        ...questionnaire,
                        entity: updatedEntity,
                    });
                });
        } else return this.surveyReporsitory.getForm(programId, undefined, undefined);
    }
}
