import { FutureData } from "../../data/api-futures";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES, SurveyBase } from "../entities/Survey";
import {
    getProgramId,
    hasSecondaryParent,
    isPrevalencePatientChild,
} from "../utils/PPSProgramsHelper";
import { PaginatedReponse, SortColumnDetails } from "../entities/TablePagination";
import { PaginatedSurveyRepository } from "../repositories/PaginatedSurveyRepository";
import { SurveyRepository } from "../repositories/SurveyRepository";
import _ from "../entities/generic/Collection";
import { getChildCount } from "../utils/getChildCountHelper";
import { Future } from "../entities/generic/Future";
import { GLOBAL_OU_ID } from "./SaveFormDataUseCase";

export class GetPaginatedSurveysUseCase {
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
        pageSize: number,
        chunked = false,
        sortColumnDetails?: SortColumnDetails
    ): FutureData<PaginatedReponse<Survey[]>> {
        const programId = getProgramId(surveyFormType);

        //All PPS Survey Forms are Global.
        const ouId = surveyFormType === "PPSSurveyForm" ? GLOBAL_OU_ID : orgUnitId;

        const parentId = isPrevalencePatientChild(surveyFormType)
            ? parentPatientId
            : surveyFormType === "PPSPatientRegister"
            ? parentWardRegisterId
            : parentSurveyId;

        return this.paginatedSurveyRepo
            .getSurveys(
                surveyFormType,
                programId,
                ouId,
                parentId,
                page,
                pageSize,
                chunked,
                sortColumnDetails
            )
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
                            surveyReporsitory: this.paginatedSurveyRepo,
                            secondaryparentId: hasSecondaryParent(surveyFormType) ? survey.id : "",
                        })
                    ).map(([parentDetails, childCount]): Survey => {
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
                                    : surveyFormType === "PrevalenceCaseReportForm"
                                    ? survey.uniquePatient?.id ?? survey.name
                                    : survey.name,
                            rootSurvey: newRootSurvey,
                            childCount: childCount,
                        };
                        return updatedSurvey;
                    });
                });

                return Future.parallel(surveysWithName, { concurrency: 5 }).map(updatedSurveys => {
                    const paginatedSurveys: PaginatedReponse<Survey[]> = {
                        pager: surveys.pager,
                        objects: updatedSurveys,
                    };
                    return paginatedSurveys;
                });
            });
    }
}
