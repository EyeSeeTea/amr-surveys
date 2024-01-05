import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { Id } from "../entities/Ref";
import { Survey, SurveyBase, SURVEY_FORM_TYPES } from "../entities/Survey";
import { getProgramId } from "../utils/PPSProgramsHelper";
import { GLOBAL_OU_ID } from "./SaveFormDataUseCase";
import _ from "../entities/generic/Collection";
import { GetAllPrevelancePatientSurveysUseCase } from "./GetAllPrevelancePatientSurveysUseCase";
import { PaginatedReponse } from "../entities/TablePagination";
import { PaginatedSurveyRepository } from "../repositories/PaginatedSurveyRepository";
import { SurveyRepository } from "../repositories/SurveyRepository";

//This use case fetched only patient surveys for both Prevelance and PPS modules
export class GetPaginatedPatientSurveysUseCase {
    constructor(
        private paginatedSurveyRepo: PaginatedSurveyRepository,
        private surveyReporsitory: SurveyRepository
    ) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        parentSurveyId: Id | undefined,
        parentWardRegisterId: Id | undefined,
        page: number,
        pageSize: number
    ): FutureData<PaginatedReponse<Survey[]>> {
        if (surveyFormType === "PrevalencePatientForms") {
            const multipleSurveysUseCase = new GetAllPrevelancePatientSurveysUseCase(
                this.paginatedSurveyRepo
            );
            return multipleSurveysUseCase
                .execute(surveyFormType, orgUnitId, parentSurveyId, page, pageSize)
                .flatMap(surveys => {
                    const surveysWithNameAndCount = surveys.objects.map(survey => {
                        return Future.joinObj({
                            parentSurveyName: this.surveyReporsitory.getSurveyNameFromId(
                                survey.rootSurvey.id,
                                "Prevalence"
                            ),
                            childCount: Future.success(undefined),
                        }).map(({ parentSurveyName, childCount }): Survey => {
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
                                childCount: childCount,
                            };
                            return updatedSurvey;
                        });
                    });

                    return Future.sequential(surveysWithNameAndCount).map(updatedSurveys => {
                        const paginatedSurveys: PaginatedReponse<Survey[]> = {
                            pager: surveys.pager,
                            objects: updatedSurveys,
                        };
                        return paginatedSurveys;
                    });
                });
        } else {
            const programId = getProgramId(surveyFormType);

            //All PPS Survey Forms are Global.
            const ouId = surveyFormType === "PPSSurveyForm" ? GLOBAL_OU_ID : orgUnitId;

            return this.paginatedSurveyRepo
                .getSurveys(surveyFormType, programId, ouId, parentWardRegisterId, page, pageSize)
                .flatMap(surveys => {
                    const surveysWithNameAndCount = surveys.objects.map(survey => {
                        return Future.joinObj({
                            parentSurveyName: this.surveyReporsitory.getSurveyNameFromId(
                                survey.rootSurvey.id,
                                surveyFormType === "PrevalenceSurveyForm" ? "Prevalence" : "PPS"
                            ),
                            childCount: Future.success(undefined),
                        }).map(({ parentSurveyName, childCount }): Survey => {
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
                                childCount: childCount,
                            };
                            return updatedSurvey;
                        });
                    });

                    return Future.sequential(surveysWithNameAndCount).map(updatedSurveys => {
                        const paginatedSurveys: PaginatedReponse<Survey[]> = {
                            pager: surveys.pager,
                            objects: updatedSurveys,
                        };
                        return paginatedSurveys;
                    });
                });
        }
    }
}
