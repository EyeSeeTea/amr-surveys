import { FutureData } from "../../data/api-futures";
import {
    SURVEY_ID_DATAELEMENT_ID,
    SURVEY_ID_PATIENT_DATAELEMENT_ID,
    WARD_ID_DATAELEMENT_ID,
} from "../../data/repositories/SurveyFormD2Repository";
import { Future } from "../entities/generic/Future";
import { Questionnaire } from "../entities/Questionnaire";
import { SURVEY_FORM_TYPES } from "../entities/Survey";

import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";

export class GetSurveyUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        parentPPSSurveyId: string | undefined,
        parentWardRegisterId: string | undefined
    ): FutureData<Questionnaire> {
        const programId = getProgramId(surveyFormType);
        if (parentPPSSurveyId) {
            return this.surveyReporsitory.getForm(programId, undefined).flatMap(questionnaire => {
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
        } else return this.surveyReporsitory.getForm(programId, undefined);
    }
}
