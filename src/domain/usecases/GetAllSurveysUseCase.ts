import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { Id } from "../entities/Ref";
import { Survey, SurveyBase, SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";
import { GLOBAL_OU_ID } from "./SaveFormDataUseCase";
import _ from "../entities/generic/Collection";

export class GetAllSurveysUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        parentSurveyId: Id | undefined,
        chunked = false
    ): FutureData<Survey[]> {
        const programId = getProgramId(surveyFormType);

        //All PPS Survey Forms are Global.
        const ouId = surveyFormType === "PPSSurveyForm" ? GLOBAL_OU_ID : orgUnitId;

        return this.surveyReporsitory
            .getSurveys(surveyFormType, programId, ouId, chunked)
            .flatMap(surveys => {
                const filteredSurveys =
                    surveyFormType === "PPSSurveyForm" ||
                    (surveyFormType === "PPSHospitalForm" && !parentSurveyId) ||
                    surveyFormType === "PrevalenceSurveyForm" ||
                    (surveyFormType === "PrevalenceFacilityLevelForm" && !parentSurveyId)
                        ? surveys
                        : _(
                              surveys.map(survey => {
                                  if (survey.rootSurvey.id === parentSurveyId) return survey;
                              })
                          )
                              .compact()
                              .value();

                const surveysWithName = filteredSurveys.map(survey => {
                    return this.surveyReporsitory
                        .getSurveyNameAndASTGuidelineFromId(
                            survey.rootSurvey.id,
                            survey.surveyFormType
                        )
                        .map((parentDetails): Survey => {
                            const newRootSurvey: SurveyBase = {
                                surveyType: survey.rootSurvey.surveyType,
                                id: survey.rootSurvey.id,
                                name:
                                    survey.rootSurvey.name === ""
                                        ? parentDetails.name
                                        : survey.rootSurvey.name,
                                astGuideline: survey.rootSurvey.astGuideline
                                    ? survey.rootSurvey.astGuideline
                                    : parentDetails.astGuidelineType,
                            };

                            const updatedSurvey: Survey = {
                                ...survey,
                                rootSurvey: newRootSurvey,
                            };
                            return updatedSurvey;
                        });
                });

                return Future.sequential(surveysWithName);
            });
    }
}
