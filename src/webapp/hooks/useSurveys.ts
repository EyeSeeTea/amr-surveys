import { useEffect, useState } from "react";
import { Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { useAppContext } from "../contexts/app-context";
import { useCurrentSurveys } from "../contexts/current-surveys-context";

export function useSurveys(surveyType: SURVEY_FORM_TYPES) {
    const { compositionRoot } = useAppContext();
    const [surveys, setSurveys] = useState<Survey[]>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const {
        currentPPSSurveyForm,
        currentCountryQuestionnaire,
        currentHospitalForm,
        currentWardRegister,
    } = useCurrentSurveys();

    useEffect(() => {
        setLoading(true);
        let orgUnitId = "";
        if (surveyType === "PPSHospitalForm")
            orgUnitId = currentCountryQuestionnaire?.orgUnitId ?? "";
        else if (surveyType === "PPSWardRegister" || surveyType === "PPSPatientRegister")
            orgUnitId = currentHospitalForm?.orgUnitId ?? "";

        compositionRoot.surveys.getSurveys
            .execute(surveyType, orgUnitId, currentPPSSurveyForm, currentWardRegister)
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
        surveyType,
        currentPPSSurveyForm,
        currentCountryQuestionnaire?.orgUnitId,
        currentHospitalForm?.orgUnitId,
        currentWardRegister,
    ]);

    return { surveys, loading, error };
}
