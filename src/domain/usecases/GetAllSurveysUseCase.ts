import { Id } from "@eyeseetea/d2-api";
import { FutureData } from "../../data/api-futures";
import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";
import { GLOBAL_OU_ID } from "./SaveFormDataUseCase";

export class GetAllSurveysUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        parentSurveyId: Id | undefined
    ): FutureData<Survey[]> {
        const programId = getProgramId(surveyType);

        //All PPS Survey Forms are Global.
        if (surveyType === "PPSSurveyForm" && orgUnitId === "") orgUnitId = GLOBAL_OU_ID;
        console.debug(parentSurveyId);
        return this.surveyReporsitory.getSurveys(programId, orgUnitId);
    }
}
