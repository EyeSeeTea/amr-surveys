import { Id } from "@eyeseetea/d2-api";
import { FutureData } from "../../data/api-futures";
import { Survey, SurveyBase } from "../entities/Survey";
import { PaginatedReponse, SortColumnDetails } from "../entities/TablePagination";
import { PaginatedSurveyRepository } from "../repositories/PaginatedSurveyRepository";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { Future } from "../entities/generic/Future";
import { getChildCount } from "../utils/getChildCountHelper";

export class GetFilteredPrevalencePatientsUseCase {
    constructor(
        private paginatedSurveyRepo: PaginatedSurveyRepository,
        private surveyReporsitory: SurveyRepository
    ) {}

    public execute(
        keyword: string,
        orgUnitId: Id,
        parentId: Id,
        sortDetails?: SortColumnDetails
    ): FutureData<PaginatedReponse<Survey[]>> {
        return this.paginatedSurveyRepo
            .getFilteredPrevalencePatientSurveysByPatientId(
                keyword,
                orgUnitId,
                parentId,
                sortDetails
            )
            .flatMap(filteredSurveys => {
                const surveysWithName = filteredSurveys.objects.map(survey => {
                    return Future.join2(
                        this.surveyReporsitory.getSurveyNameAndASTGuidelineFromId(
                            survey.rootSurvey.id,
                            survey.surveyFormType
                        ),
                        getChildCount({
                            surveyFormType: "PrevalenceCaseReportForm",
                            orgUnitId: survey.assignedOrgUnit.id,
                            parentSurveyId: survey.rootSurvey.id,
                            secondaryparentId: survey.id,
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
