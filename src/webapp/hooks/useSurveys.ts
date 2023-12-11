import { useEffect, useState } from "react";
import { Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { GLOBAL_OU_ID } from "../../domain/usecases/SaveFormDataUseCase";
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
    } = useCurrentSurveys();

    useEffect(() => {
        setLoading(true);
        let orgUnitId = "";
        if (surveyFormType === "PPSHospitalForm")
            orgUnitId = currentCountryQuestionnaire?.orgUnitId ?? "";
        else if (surveyFormType === "PPSWardRegister" || surveyFormType === "PPSPatientRegister")
            orgUnitId = currentHospitalForm?.orgUnitId ?? "";
        //TO DO : Temporarily setting Prevelance OU to Global
        else if (surveyFormType === "PrevelancePlaceholder") orgUnitId = GLOBAL_OU_ID;

        compositionRoot.surveys.getSurveys
            .execute(surveyFormType, orgUnitId, currentPPSSurveyForm?.id, currentWardRegister?.id)
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
    ]);

    return { surveys, loading, error };
}
