import { AMRSurveyModule } from "../entities/AMRSurveyModule";

export function getDisabledForms(
    currentModule: AMRSurveyModule | undefined,
    parentSurveyId: string
) {
    const customFormsBySurvey = currentModule?.customForms?.[parentSurveyId];

    const disabledForms = customFormsBySurvey
        ? Object.entries(customFormsBySurvey)
              .filter(([_, value]) => !value || value === "")
              .map(([key]) => key)
        : [];

    return disabledForms;
}
