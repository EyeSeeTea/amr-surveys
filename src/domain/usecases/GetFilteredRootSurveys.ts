import { FutureData } from "../../data/api-futures";
import { Maybe } from "../../utils/ts-utils";
import { Future } from "../entities/generic/Future";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES, SURVEY_TYPES, SurveyBase } from "../entities/Survey";
import { PaginatedReponse, SortColumnDetails } from "../entities/TablePagination";
import { PaginatedSurveyRepository } from "../repositories/PaginatedSurveyRepository";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { getChildCount } from "../utils/getChildCountHelper";
import { hasSecondaryParent } from "../utils/PPSProgramsHelper";

export class GetFilteredRootSurveysUseCase {
    constructor(
        private paginatedSurveyRepo: PaginatedSurveyRepository,
        private surveyReporsitory: SurveyRepository
    ) {}

    public execute(
        orgUnitId: Id,
        surveyFormType: SURVEY_FORM_TYPES,
        surveyType: Maybe<SURVEY_TYPES>,
        page: number,
        pageSize: number,
        sortColumnDetails?: SortColumnDetails
    ): FutureData<PaginatedReponse<Survey[]>> {
        return this.paginatedSurveyRepo
            .getFilteredPPSSurveys(orgUnitId, surveyType, page, pageSize, sortColumnDetails)
            .flatMap(filteredSurveys => {
                const surveysWithName = filteredSurveys.objects.map(survey => {
                    return Future.join2(
                        this.surveyReporsitory.getSurveyNameAndASTGuidelineFromId(
                            survey.rootSurvey.id,
                            survey.surveyFormType
                        ),
                        getChildCount({
                            surveyFormType: surveyFormType,
                            orgUnitId: survey.assignedOrgUnit.id,
                            parentSurveyId: survey.rootSurvey.id,
                            secondaryparentId: hasSecondaryParent(surveyFormType) ? survey.id : "",
                            surveyReporsitory: this.paginatedSurveyRepo,
                        })
                    ).map(([parentDetails, childCount]): Survey => {
                        const newRootSurvey: SurveyBase = {
                            surveyType: survey.rootSurvey.surveyType,
                            id: survey.rootSurvey.id,
                            name:
                                survey.rootSurvey.name === ""
                                    ? parentDetails.name
                                    : survey.rootSurvey.name,
                        };

                        const updatedSurvey: Survey = {
                            ...survey,
                            rootSurvey: newRootSurvey,
                            childCount: childCount,
                        };
                        return updatedSurvey;
                    });
                });

                return Future.parallel(surveysWithName, { concurrency: 5 }).map(updatedSurveys => {
                    const paginatedSurveys: PaginatedReponse<Survey[]> = {
                        pager: filteredSurveys.pager,
                        objects: updatedSurveys,
                    };
                    return paginatedSurveys;
                });
            });
    }
}
