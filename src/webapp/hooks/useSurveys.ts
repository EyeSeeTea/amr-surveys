import { useEffect, useState } from "react";
import { Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { useAppContext } from "../contexts/app-context";
import { useCurrentSurveys } from "../contexts/current-surveys-context";

export function useSurveys(surveyFormType: SURVEY_FORM_TYPES) {
    const { compositionRoot } = useAppContext();
    const [surveys, setSurveys] = useState<Survey[]>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [shouldRefreshSurveys, setRefreshSurveys] = useState({});
    const [page, setPage] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(5);
    const [total, setTotal] = useState<number>();
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

        compositionRoot.surveys.getSurveys
            .execute(
                surveyFormType,
                orgUnitId,
                currentPPSSurveyForm?.id,
                currentWardRegister?.id,
                page,
                pageSize
            )
            .run(
                ({ pager: { total }, objects: surveys }) => {
                    setSurveys(surveys);
                    setTotal(total);
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
        shouldRefreshSurveys,
        page,
        pageSize,
    ]);

    return { surveys, loading, error, setRefreshSurveys, page, setPage, pageSize, setPageSize, total };
}
