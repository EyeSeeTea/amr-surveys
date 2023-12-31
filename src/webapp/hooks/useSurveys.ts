import { useEffect, useState } from "react";
import { Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { useAppContext } from "../contexts/app-context";
import { useCurrentSurveys } from "../contexts/current-surveys-context";

const PAGE_SIZE = 5;
export function useSurveys(surveyFormType: SURVEY_FORM_TYPES) {
    const { compositionRoot } = useAppContext();
    const [surveys, setSurveys] = useState<Survey[]>();
    const [loadingSurveys, setLoadingSurveys] = useState(false);
    const [errorSurveys, setErrorSurveys] = useState<string>();
    const [shouldRefreshSurveys, setRefreshSurveys] = useState({});
    const [page, setPage] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(PAGE_SIZE);
    const [total, setTotal] = useState<number>();
    const {
        currentPPSSurveyForm,
        currentCountryQuestionnaire,
        currentHospitalForm,
        currentWardRegister,
        currentPrevalenceSurveyForm,
        currentFacilityLevelForm,
    } = useCurrentSurveys();

    useEffect(() => {
        setLoadingSurveys(true);

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

        if (
            surveyFormType === "PPSPatientRegister" ||
            surveyFormType === "PrevalencePatientForms"
        ) {
            compositionRoot.surveys.getPaginatedSurveys
                .execute(
                    surveyFormType,
                    orgUnitId,
                    parentSurveyId,
                    currentWardRegister?.id,
                    page,
                    PAGE_SIZE
                )
                .run(
                    paginatedSurveys => {
                        setSurveys(paginatedSurveys.objects);
                        setTotal(paginatedSurveys.pager.total);
                        setPageSize(paginatedSurveys.pager.pageSize);
                        setLoadingSurveys(false);
                    },
                    err => {
                        setErrorSurveys(err.message);
                        setLoadingSurveys(false);
                    }
                );
        } else {
            compositionRoot.surveys.getSurveys
                .execute(surveyFormType, orgUnitId, parentSurveyId)
                .run(
                    surveys => {
                        setSurveys(surveys);
                        setLoadingSurveys(false);
                    },
                    err => {
                        setErrorSurveys(err.message);
                        setLoadingSurveys(false);
                    }
                );
        }
    }, [
        compositionRoot.surveys.getPaginatedSurveys,
        compositionRoot.surveys.getSurveys,
        surveyFormType,
        currentPPSSurveyForm,
        currentCountryQuestionnaire?.orgUnitId,
        currentHospitalForm?.orgUnitId,
        currentWardRegister,
        currentPrevalenceSurveyForm,
        currentFacilityLevelForm,
        shouldRefreshSurveys,
        page,
    ]);

    return {
        surveys,
        loadingSurveys,
        errorSurveys,
        setRefreshSurveys,
        page,
        setPage,
        pageSize,
        setPageSize,
        total,
    };
}
