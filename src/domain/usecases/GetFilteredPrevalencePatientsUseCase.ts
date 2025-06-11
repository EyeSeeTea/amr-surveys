import { Id } from "@eyeseetea/d2-api";
import { FutureData } from "../../data/api-futures";
import { Survey, SurveyBase } from "../entities/Survey";
import { PaginatedReponse } from "../entities/TablePagination";
import { PaginatedSurveyRepository } from "../repositories/PaginatedSurveyRepository";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { Future } from "../entities/generic/Future";
import { getChildCount } from "../utils/getChildCountHelper";
import { ModuleRepository } from "../repositories/ModuleRepository";
import { getProgramId } from "../utils/getDefaultOrCustomProgramId";

export class GetFilteredPrevalencePatientsUseCase {
    constructor(
        private paginatedSurveyRepo: PaginatedSurveyRepository,
        private surveyReporsitory: SurveyRepository,
        private moduleRepository: ModuleRepository
    ) {}

    public execute(
        keyword: string,
        orgUnitId: Id,
        parentId: Id
    ): FutureData<PaginatedReponse<Survey[]>> {
        const surveyFormType = "PrevalenceCaseReportForm";

        return this.paginatedSurveyRepo
            .getFilteredPrevalencePatientSurveysByPatientId(keyword, orgUnitId, parentId)
            .flatMap(filteredSurveys => {
                const surveysWithName = filteredSurveys.objects.map(survey => {
                    return this.moduleRepository.getAll().flatMap(modules => {
                        const programId = getProgramId(
                            surveyFormType,
                            survey.rootSurvey.id,
                            modules
                        );

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
                                programId: programId,
                                modules,
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
