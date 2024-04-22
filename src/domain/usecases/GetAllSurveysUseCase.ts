import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { Id } from "../entities/Ref";
import { Survey, SurveyBase, SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";
import { GLOBAL_OU_ID } from "./SaveFormDataUseCase";
import _ from "../entities/generic/Collection";
import { getChildCount } from "../utils/getChildCount";

export class GetAllSurveysUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        parentSurveyId: Id | undefined
    ): FutureData<Survey[]> {
        const programId = getProgramId(surveyFormType);

        //All PPS Survey Forms are Global.
        const ouId = surveyFormType === "PPSSurveyForm" ? GLOBAL_OU_ID : orgUnitId;

        return this.surveyReporsitory
            .getSurveys(surveyFormType, programId, ouId)
            .flatMap(surveys => {
                const filteredSurveys =
                    surveyFormType === "PPSSurveyForm" ||
                    (surveyFormType === "PPSHospitalForm" && !parentSurveyId) ||
                    surveyFormType === "PrevalenceSurveyForm"
                        ? surveys
                        : _(
                              surveys.map(survey => {
                                  if (survey.rootSurvey.id === parentSurveyId) return survey;
                              })
                          )
                              .compact()
                              .value();

                const surveysWithName = filteredSurveys.map(survey => {
                    return Future.join2(
                        this.surveyReporsitory.getSurveyNameFromId(
                            survey.rootSurvey.id,
                            survey.surveyFormType
                        ),
                        getChildCount({
                            surveyFormType: surveyFormType,
                            orgUnitId: survey.assignedOrgUnit.id,
                            parentSurveyId: survey.rootSurvey.id,
                            surveyReporsitory: this.surveyReporsitory,
                        })
                    ).map(([parentSurveyName, childCount]): Survey => {
                        const count =
                            typeof childCount === "number"
                                ? childCount
                                : childCount
                                      .map(child => child.count)
                                      .reduce((agg, childCount) => agg + childCount, 0);

                        const newRootSurvey: SurveyBase = {
                            surveyType: survey.rootSurvey.surveyType,
                            id: survey.rootSurvey.id,
                            name:
                                survey.rootSurvey.name === ""
                                    ? parentSurveyName
                                    : survey.rootSurvey.name,
                        };

                        const updatedSurvey: Survey = {
                            ...survey,
                            rootSurvey: newRootSurvey,
                            childCount: count,
                        };
                        return updatedSurvey;
                    });
                });

                return Future.sequential(surveysWithName);
            });
    }
}
