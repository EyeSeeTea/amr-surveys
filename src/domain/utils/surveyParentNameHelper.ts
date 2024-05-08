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
            .getSurveyNameFromId(survey.rootSurvey.id, survey.surveyFormType)
            .map((parentSurveyName): Survey => {
                const updatedSurvey: Survey = {
                    ...survey,
                    rootSurvey: {
                        surveyType: survey.rootSurvey.surveyType,
                        id: survey.rootSurvey.id,
                        name:
                            survey.rootSurvey.name === ""
                                ? parentSurveyName
                                : survey.rootSurvey.name,
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
