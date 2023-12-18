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
import { Questionnaire } from "../entities/Questionnaire";
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
                    //PPS Questionnaires have only 1 stage
                    const surveyIdSection = questionnaire.stages[0]?.sections.find(
                        s =>
                            s.questions.find(
                                q =>
                                    q.id === SURVEY_ID_DATAELEMENT_ID ||
                                    q.id === SURVEY_ID_PATIENT_DATAELEMENT_ID
                            ) !== undefined
                    );
                    if (surveyIdSection) {
                        const surveyIdDataElement = surveyIdSection.questions.find(
                            q =>
                                q.id === SURVEY_ID_DATAELEMENT_ID ||
                                q.id === SURVEY_ID_PATIENT_DATAELEMENT_ID
                        );
                        if (surveyIdDataElement) {
                            surveyIdDataElement.value = parentPPSSurveyId;
                        }
                    }

                    //PPS Questionnaires have only 1 stage
                    const wardIdSection = questionnaire.stages[0]?.sections.find(
                        s => s.questions.find(q => q.id === WARD_ID_DATAELEMENT_ID) !== undefined
                    );
                    if (wardIdSection) {
                        const wardIdDataElement = wardIdSection.questions.find(
                            q => q.id === WARD_ID_DATAELEMENT_ID
                        );
                        if (wardIdDataElement) {
                            wardIdDataElement.value = parentWardRegisterId;
                        }
                    }
                    return Future.success(questionnaire);
                });
        } else if (parentPrevalenceSurveyId) {
            return this.surveyReporsitory
                .getForm(programId, undefined, undefined)
                .flatMap(questionnaire => {
                    //The Survey Id is always part of Tracked Entity which is the Profile Section i.e questionnaire.entity
                    const surveyIdDataElement = questionnaire.entity?.questions.find(
                        q =>
                            q.id === SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID ||
                            q.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF ||
                            q.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL ||
                            q.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS ||
                            q.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL ||
                            q.id === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF
                    );
                    if (surveyIdDataElement) surveyIdDataElement.value = parentPrevalenceSurveyId;

                    return Future.success(questionnaire);
                });
        } else return this.surveyReporsitory.getForm(programId, undefined, undefined);
    }
}
