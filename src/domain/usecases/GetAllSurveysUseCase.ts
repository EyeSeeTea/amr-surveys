import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";
import { GLOBAL_OU_ID } from "./SaveFormDataUseCase";
import _ from "../entities/generic/Collection";

export class GetAllSurveysUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        parentPPSSurveyId: Id | undefined,
        parentWardRegisterId: Id | undefined
    ): FutureData<Survey[]> {
        const programId = getProgramId(surveyType);

        //All PPS Survey Forms are Global.
        if (surveyType === "PPSSurveyForm") orgUnitId = GLOBAL_OU_ID;

        return this.surveyReporsitory.getSurveys(programId, orgUnitId).flatMap(surveys => {
            //Parent Id should be set only for child forms, this is a just an additional check
            if (parentPPSSurveyId) {
                if (surveyType === "PPSPatientRegister") {
                    //Filter Surveys by parentWardRegisterId
                    const filteredSurveys = _(
                        surveys.map(survey => {
                            if (survey.parentWardRegisterId === parentWardRegisterId) return survey;
                        })
                    )
                        .compact()
                        .value();

                    return Future.success(filteredSurveys);
                } else if (surveyType !== "PPSSurveyForm") {
                    //Filter Surveys by parentPPSSurveyId
                    const filteredSurveys = _(
                        surveys.map(survey => {
                            if (survey.parentPPSSurveyId === parentPPSSurveyId) return survey;
                        })
                    )
                        .compact()
                        .value();

                    return Future.success(filteredSurveys);
                } else return Future.success([]);
            } else return Future.success(surveys);
        });
    }
}
