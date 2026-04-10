import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { Id } from "../entities/Ref";
import { Survey, SurveyBase, SurveyParentDetails, SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { GLOBAL_OU_ID } from "./SaveFormDataUseCase";
import { getChildCount } from "../utils/getChildCountHelper";
import { ModuleRepository } from "../repositories/ModuleRepository";
import { getProgramId } from "../utils/getDefaultOrCustomProgramId";
import _ from "../entities/generic/Collection";

export class GetAllSurveysUseCase {
    constructor(
        private surveyReporsitory: SurveyRepository,
        private moduleRepository: ModuleRepository
    ) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        parentSurveyId: Id | undefined,
        chunked = false
    ): FutureData<Survey[]> {
        return this.moduleRepository.getAll().flatMap(modules => {
            const programId = getProgramId(surveyFormType, parentSurveyId, modules);

            //All PPS Survey Forms are Global.
            const ouId = surveyFormType === "PPSSurveyForm" ? GLOBAL_OU_ID : orgUnitId;

            return Future.joinObj({
                surveys: this.surveyReporsitory.getSurveys({
                    surveyFormType: surveyFormType,
                    programId: programId,
                    parentId: parentSurveyId,
                    orgUnitId: ouId,
                    chunked: chunked,
                }),
                modules: Future.success(modules),
            }).flatMap(({ surveys, modules }) => {
                // Deduplicate parent-detail lookups: fetch once per unique
                // rootSurveyId, then distribute via a Map. Same pattern as
                // GetPaginatedSurveysUseCase. Without this, every row on
                // the facility list fires an identical tracker/events/{id}
                // request for the shared parent survey.
                const $parentDetails: Array<FutureData<readonly [Id, SurveyParentDetails]>> =
                    _(surveys)
                        .groupBy(s => s.rootSurvey.id)
                        .toPairs()
                        .map(([rootSurveyId, group]) =>
                            this.surveyReporsitory
                                .getSurveyNameAndASTGuidelineFromId(
                                    rootSurveyId,
                                    group[0]?.surveyFormType ?? surveyFormType
                                )
                                .map(details => [rootSurveyId, details] as const)
                        );

                return Future.parallel($parentDetails, { concurrency: 5 }).flatMap(pairs => {
                    const parentDetailsMap = new Map<Id, SurveyParentDetails>(pairs);

                    const surveysWithName = surveys.map(survey => {
                        return getChildCount({
                            surveyFormType: surveyFormType,
                            orgUnitId: survey.assignedOrgUnit.id,
                            parentSurveyId: survey.rootSurvey.id,
                            surveyReporsitory: this.surveyReporsitory,
                            secondaryparentId:
                                surveyFormType === "PPSWardRegister" ? survey.id : "",
                            programId: programId,
                            modules,
                        }).map((childCount): Survey => {
                            const parentDetails = parentDetailsMap.get(survey.rootSurvey.id);

                            const rootName =
                                survey.rootSurvey.name === ""
                                    ? parentDetails?.name ?? ""
                                    : survey.rootSurvey.name;

                            const newRootSurvey: SurveyBase = {
                                surveyType: survey.rootSurvey.surveyType,
                                id: survey.rootSurvey.id,
                                name: rootName,
                                astGuideline: survey.rootSurvey.astGuideline
                                    ? survey.rootSurvey.astGuideline
                                    : parentDetails?.astGuidelineType,
                            };

                            return {
                                ...survey,
                                name:
                                    surveyFormType === "PrevalenceSurveyForm"
                                        ? parentDetails?.name ?? survey.name
                                        : surveyFormType === "PrevalenceFacilityLevelForm"
                                        ? survey.facilityCode ?? survey.name
                                        : survey.name,
                                rootSurvey: newRootSurvey,
                                childCount: childCount,
                            };
                        });
                    });

                    return Future.parallel(surveysWithName, { concurrency: 5 });
                });
            });
        });
    }
}
