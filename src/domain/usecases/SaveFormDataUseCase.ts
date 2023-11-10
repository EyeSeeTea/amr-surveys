import { FutureData } from "../../data/api-futures";
import { Questionnaire } from "../entities/Questionnaire";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import _ from "../../domain/entities/generic/Collection";
import { Id } from "../entities/Ref";
import { getProgramId } from "../utils/PPSProgramsHelper";

export const GLOBAL_OU_ID = "H8RixfF8ugH";
export class SaveFormDataUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyType: SURVEY_FORM_TYPES,
        questionnaire: Questionnaire,
        orgUnitId: Id,
        eventId: string | undefined = undefined
    ): FutureData<void> {
        const programId = getProgramId(surveyType);

        //All PPS Survey Forms are Global.
        if (surveyType === "PPSSurveyForm" && orgUnitId === "") orgUnitId = GLOBAL_OU_ID;

        return this.surveyReporsitory.saveFormData(
            questionnaire,
            "CREATE_AND_UPDATE",
            orgUnitId,
            eventId,
            programId
        );
    }
}
