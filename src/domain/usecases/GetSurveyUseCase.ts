import { FutureData } from "../../data/api-futures";
import {
    PPS_COUNTRY_QUESTIONNAIRE_ID,
    PPS_SURVEY_FORM_ID,
    SURVEY_ID_DATAELEMENT_ID,
} from "../../data/repositories/SurveyFormD2Repository";
import { Future } from "../entities/generic/Future";
import { Questionnaire } from "../entities/Questionnaire";
import { SURVEY_FORM_TYPES } from "../entities/Survey";

import { SurveyRepository } from "../repositories/SurveyRepository";

export class GetSurveyUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyType: SURVEY_FORM_TYPES,
        parentSurveyId: string | undefined
    ): FutureData<Questionnaire> {
        let programId = "";
        switch (surveyType) {
            case "PPSSurveyForm":
                programId = PPS_SURVEY_FORM_ID;
                break;
            case "PPSCountryQuestionnaire":
                programId = PPS_COUNTRY_QUESTIONNAIRE_ID;
                break;
            default:
                return Future.error(new Error("Unknown survey type"));
        }

        if (parentSurveyId) {
            return this.surveyReporsitory.getForm(programId, undefined).flatMap(q => {
                console.debug(q.sections);
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
