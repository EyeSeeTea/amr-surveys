import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { Id } from "../entities/Ref";
import { Survey, SurveyBase, SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";
import { GLOBAL_OU_ID } from "./SaveFormDataUseCase";
import { getChildCount } from "../utils/getChildCountHelper";

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
            .getSurveys({
                surveyFormType: surveyFormType,
                programId: programId,
                parentId: parentSurveyId,
                orgUnitId: ouId,
                chunked: chunked,
            })
            .flatMap(surveys => {
                const surveysWithName = surveys.map(survey => {
                    return Future.join2(
                        this.surveyReporsitory.getSurveyNameAndASTGuidelineFromId(
                            survey.rootSurvey.id,
                            survey.surveyFormType
                        ),
                        getChildCount({
                            surveyFormType: surveyFormType,
                            orgUnitId: survey.assignedOrgUnit.id,
                            parentSurveyId: survey.rootSurvey.id,
                            surveyReporsitory: this.surveyReporsitory,
                            secondaryparentId:
                                surveyFormType === "PPSWardRegister" ? survey.id : "",
                        })
                    ).map(([parentDetails, childCount]): Survey => {
                        const count =
                            typeof childCount === "number"
                                ? childCount
                                : childCount
                                      .map(child => child.count)
                                      .reduce((agg, childCount) => agg + childCount, 0);

                        const rootName =
                            survey.rootSurvey.name === ""
                                ? parentDetails.name
                                : survey.rootSurvey.name;

                        const newRootSurvey: SurveyBase = {
                            surveyType: survey.rootSurvey.surveyType,
                            id: survey.rootSurvey.id,
                            name: rootName,
                            astGuideline: survey.rootSurvey.astGuideline
                                ? survey.rootSurvey.astGuideline
                                : parentDetails.astGuidelineType,
                        };

                        const updatedSurvey: Survey = {
                            ...survey,
                            name:
                                surveyFormType === "PrevalenceSurveyForm"
                                    ? parentDetails.name
                                    : surveyFormType === "PrevalenceFacilityLevelForm"
                                    ? survey.facilityCode ?? survey.name
                                    : survey.name,
                            rootSurvey: newRootSurvey,
                            childCount: count,
                        };
                        return updatedSurvey;
                    });
                });

                return Future.parallel(surveysWithName, { concurrency: 5 });
            });
    }
}
