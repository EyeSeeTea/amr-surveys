import { useEffect, useState } from "react";
import { Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { useAppContext } from "../contexts/app-context";
import { useCurrentSurveys } from "../contexts/current-surveys-context";

export function useSurveys(surveyFormType: SURVEY_FORM_TYPES) {
    const { compositionRoot } = useAppContext();
    const [surveys, setSurveys] = useState<Survey[]>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const {
        currentPPSSurveyForm,
        currentCountryQuestionnaire,
        currentHospitalForm,
        currentWardRegister,
        currentPrevalenceSurveyForm,
        currentFacilityLevelForm,
    } = useCurrentSurveys();

    useEffect(() => {
        setLoading(true);

        const parentSurveyId =
            surveyFormType === "PrevalenceFacilityLevelForm" ||
            surveyFormType === "PrevalencePatientForms"
                ? currentPrevalenceSurveyForm?.id
                : currentPPSSurveyForm?.id;

        let orgUnitId = "";
        if (surveyFormType === "PPSHospitalForm")
            orgUnitId = currentCountryQuestionnaire?.orgUnitId ?? "";
        else if (surveyFormType === "PPSWardRegister" || surveyFormType === "PPSPatientRegister")
            orgUnitId = currentHospitalForm?.orgUnitId ?? "";
        else if (surveyFormType === "PrevalenceFacilityLevelForm") {
            orgUnitId = currentPrevalenceSurveyForm?.orgUnitId ?? "";
        } else if (surveyFormType === "PrevalencePatientForms") {
            orgUnitId = currentFacilityLevelForm?.orgUnitId ?? "";
        }

        compositionRoot.surveys.getSurveys
            .execute(surveyFormType, orgUnitId, parentSurveyId, currentWardRegister?.id)
            .run(
                surveys => {
                    setSurveys(surveys);
                    setLoading(false);
                },
                err => {
                    setError(err.message);
                    setLoading(false);
                }
            );
    }, [
        compositionRoot.surveys.getSurveys,
        surveyFormType,
        currentPPSSurveyForm,
        currentCountryQuestionnaire?.orgUnitId,
        currentHospitalForm?.orgUnitId,
        currentWardRegister,
        currentPrevalenceSurveyForm,
        currentFacilityLevelForm,
    ]);

    return { surveys, loading, error };
}
