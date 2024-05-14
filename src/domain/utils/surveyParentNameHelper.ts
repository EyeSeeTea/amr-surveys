import { Survey } from "../entities/Survey";
import { PaginatedReponse } from "../entities/TablePagination";
import { Future } from "../entities/generic/Future";
import { SurveyRepository } from "../repositories/SurveyRepository";

export const getPaginatedSurveysWithParentName = (
    surveys: PaginatedReponse<Survey[]>,
    surveyReporsitory: SurveyRepository
) => {
    const surveysWithName = surveys.objects.map(survey => {
        return surveyReporsitory
            .getSurveyNameAndASTGuidelineFromId(survey.rootSurvey.id, survey.surveyFormType)
            .map(({ name, astGuidelineType }): Survey => {
                const updatedSurvey: Survey = {
                    ...survey,
                    rootSurvey: {
                        surveyType: survey.rootSurvey.surveyType,
                        id: survey.rootSurvey.id,
                        name: survey.rootSurvey.name === "" ? name : survey.rootSurvey.name,
                        astGuideline: astGuidelineType,
                    },
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
};
