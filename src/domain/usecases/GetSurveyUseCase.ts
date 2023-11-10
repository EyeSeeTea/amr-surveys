import { FutureData } from "../../data/api-futures";
import { SURVEY_ID_DATAELEMENT_ID } from "../../data/repositories/SurveyFormD2Repository";
import { Future } from "../entities/generic/Future";
import { Questionnaire } from "../entities/Questionnaire";
import { SURVEY_FORM_TYPES } from "../entities/Survey";

import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";

export class GetSurveyUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyType: SURVEY_FORM_TYPES,
        parentSurveyId: string | undefined
    ): FutureData<Questionnaire> {
        const programId = getProgramId(surveyType);
        if (parentSurveyId) {
            return this.surveyReporsitory.getForm(programId, undefined).flatMap(q => {
                const surveyIdSection = q.sections.find(
                    s => s.questions.find(q => q.id === SURVEY_ID_DATAELEMENT_ID) !== undefined
                );
                if (surveyIdSection) {
                    const surveyIdDataElement = surveyIdSection.questions.find(
                        q => q.id === SURVEY_ID_DATAELEMENT_ID
                    );
                    if (surveyIdDataElement) {
                        surveyIdDataElement.value = parentSurveyId;
                    }
                }
                return Future.success(q);
            });
        } else return this.surveyReporsitory.getForm(programId, undefined);
    }
}
