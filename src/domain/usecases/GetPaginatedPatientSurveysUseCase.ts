import { FutureData } from "../../data/api-futures";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES, SurveyBase } from "../entities/Survey";
import { getProgramId, isPrevalencePatientChild } from "../utils/PPSProgramsHelper";
import { PaginatedReponse } from "../entities/TablePagination";
import { PaginatedSurveyRepository } from "../repositories/PaginatedSurveyRepository";
import { SurveyRepository } from "../repositories/SurveyRepository";
import _ from "../entities/generic/Collection";
import { getChildCount } from "../utils/getChildCountHelper";
import { Future } from "../entities/generic/Future";

//This use case fetched only patient surveys for both Prevalence and PPS modules
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
        parentPatientId: Id | undefined,
        page: number,
        pageSize: number
    ): FutureData<PaginatedReponse<Survey[]>> {
        const programId = getProgramId(surveyFormType);

        const parentId = isPrevalencePatientChild(surveyFormType)
            ? parentPatientId
            : surveyFormType === "PPSPatientRegister"
            ? parentWardRegisterId
            : parentSurveyId;

        return this.paginatedSurveyRepo
            .getSurveys(surveyFormType, programId, orgUnitId, parentId, page, pageSize)
            .flatMap(surveys => {
                const surveysWithName = surveys.objects.map(survey => {
                    return Future.join2(
                        this.surveyReporsitory.getSurveyNameAndASTGuidelineFromId(
                            survey.rootSurvey.id,
                            survey.surveyFormType
                        ),
                        getChildCount({
                            surveyFormType: surveyFormType,
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

                return Future.sequential(surveysWithName).map(updatedSurveys => {
                    const paginatedSurveys: PaginatedReponse<Survey[]> = {
                        pager: surveys.pager,
                        objects: updatedSurveys,
                    };
                    return paginatedSurveys;
                });
            });
    }
}
