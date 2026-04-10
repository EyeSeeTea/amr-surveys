import { FutureData } from "../../data/api-futures";
import { Id } from "../entities/Ref";
import { Survey, SurveyParentDetails } from "../entities/Survey";
import { PaginatedReponse } from "../entities/TablePagination";
import { Future } from "../entities/generic/Future";
import _ from "../entities/generic/Collection";
import { SurveyRepository } from "../repositories/SurveyRepository";

export const getPaginatedSurveysWithParentName = (
    surveys: PaginatedReponse<Survey[]>,
    surveyReporsitory: SurveyRepository
): FutureData<PaginatedReponse<Survey[]>> => {
    // Deduplicate parent-detail lookups: fetch once per unique rootSurveyId,
    // then distribute via a Map. Without this, every row with the same
    // parent fires an identical tracker/events/{id} request.
    const $parentDetails = _(surveys.objects)
        .groupBy(s => s.rootSurvey.id)
        .toPairs()
        .map(([rootSurveyId, group]) =>
            surveyReporsitory
                .getSurveyNameAndASTGuidelineFromId(
                    rootSurveyId,
                    group[0]?.surveyFormType ?? "PPSSurveyForm"
                )
                .map(details => [rootSurveyId, details] as const)
        );

    return Future.parallel($parentDetails, { concurrency: 5 }).flatMap(pairs => {
        const parentDetailsMap = new Map<Id, SurveyParentDetails>(pairs);

        const updatedSurveys = surveys.objects.map((survey): Survey => {
            const parentDetails = parentDetailsMap.get(survey.rootSurvey.id);
            return {
                ...survey,
                rootSurvey: {
                    surveyType: survey.rootSurvey.surveyType,
                    id: survey.rootSurvey.id,
                    name:
                        survey.rootSurvey.name === ""
                            ? parentDetails?.name ?? ""
                            : survey.rootSurvey.name,
                    astGuideline: parentDetails?.astGuidelineType,
                },
            };
        });

        return Future.success({
            pager: surveys.pager,
            objects: updatedSurveys,
        });
    });
};
