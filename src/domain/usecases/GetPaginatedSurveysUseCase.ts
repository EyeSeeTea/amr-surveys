import { FutureData } from "../../data/api-futures";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES, SurveyBase } from "../entities/Survey";
import { isPrevalencePatientChild } from "../utils/PPSProgramsHelper";
import { PaginatedReponse } from "../entities/TablePagination";
import { PaginatedSurveyRepository } from "../repositories/PaginatedSurveyRepository";
import { SurveyRepository } from "../repositories/SurveyRepository";
import _ from "../entities/generic/Collection";
import { getChildCount } from "../utils/getChildCountHelper";
import { Future } from "../entities/generic/Future";
import { ModuleRepository } from "../repositories/ModuleRepository";
import { getProgramId } from "../utils/getDefaultOrCustomProgramId";
import { AMRSurveyModule } from "../entities/AMRSurveyModule";

type GetPaginatedSurveysOptions = {
    surveyFormType: SURVEY_FORM_TYPES;
    orgUnitId: Id;
    parentSurveyId: Id | undefined;
    parentWardRegisterId: Id | undefined;
    parentPatientId: Id | undefined;
    page: number;
    pageSize: number;
    currentModule?: AMRSurveyModule;
};

export class GetPaginatedSurveysUseCase {
    constructor(
        private paginatedSurveyRepo: PaginatedSurveyRepository,
        private surveyReporsitory: SurveyRepository,
        private moduleRepository: ModuleRepository
    ) {}

    public execute({
        surveyFormType,
        orgUnitId,
        parentSurveyId,
        parentWardRegisterId,
        parentPatientId,
        page,
        pageSize,
        currentModule,
    }: GetPaginatedSurveysOptions): FutureData<PaginatedReponse<Survey[]>> {
        return this.moduleRepository.getAll().flatMap(modules => {
            const programId = getProgramId(surveyFormType, parentSurveyId, modules);

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
                                programId: programId,
                                modules: modules,
                                currentModule: currentModule,
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
                                name:
                                    surveyFormType === "PrevalenceCaseReportForm"
                                        ? survey.uniquePatient?.id ?? survey.name
                                        : survey.name,
                                rootSurvey: newRootSurvey,
                                childCount: childCount,
                            };
                            return updatedSurvey;
                        });
                    });

                    return Future.parallel(surveysWithName, { concurrency: 5 }).map(
                        updatedSurveys => {
                            const paginatedSurveys: PaginatedReponse<Survey[]> = {
                                pager: surveys.pager,
                                objects: updatedSurveys,
                            };
                            return paginatedSurveys;
                        }
                    );
                });
        });
    }
}
