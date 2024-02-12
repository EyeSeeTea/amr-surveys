import { useCallback, useEffect, useState } from "react";
import { Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { useAppContext } from "../contexts/app-context";
import { useCurrentSurveys } from "../contexts/current-surveys-context";
import { isPaginatedSurveyList } from "../../domain/utils/PPSProgramsHelper";

const PAGE_SIZE = 10;
export function useSurveys(surveyFormType: SURVEY_FORM_TYPES) {
    const { compositionRoot } = useAppContext();
    const [surveys, setSurveys] = useState<Survey[]>();
    const [loadingSurveys, setLoadingSurveys] = useState(false);
    const [surveysError, setSurveysError] = useState<string>();
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

    const getOrgUnitByFormType = useCallback(() => {
        switch (surveyFormType) {
            case "PPSHospitalForm":
                return currentCountryQuestionnaire?.orgUnitId ?? "";
            case "PPSWardRegister":
            case "PPSPatientRegister":
                return currentHospitalForm?.orgUnitId ?? "";

            case "PrevalenceFacilityLevelForm":
                return currentPrevalenceSurveyForm?.orgUnitId ?? "";
            case "PrevalenceCaseReportForm":
            case "PrevalenceCentralRefLabForm":
            case "PrevalencePathogenIsolatesLog":
            case "PrevalenceSampleShipTrackForm":
            case "PrevalenceSupranationalRefLabForm":
                return currentFacilityLevelForm?.orgUnitId ?? "";
            default:
                return "";
        }
    }, [
        currentCountryQuestionnaire?.orgUnitId,
        currentFacilityLevelForm?.orgUnitId,
        currentHospitalForm?.orgUnitId,
        currentPrevalenceSurveyForm?.orgUnitId,
        surveyFormType,
    ]);

    useEffect(() => {
        setLoadingSurveys(true);

        const parentSurveyId =
            surveyFormType === "PrevalenceFacilityLevelForm" ||
            surveyFormType === "PrevalenceCaseReportForm" ||
            surveyFormType === "PrevalenceCentralRefLabForm" ||
            surveyFormType === "PrevalencePathogenIsolatesLog" ||
            surveyFormType === "PrevalenceSampleShipTrackForm" ||
            surveyFormType === "PrevalenceSupranationalRefLabForm"
                ? currentPrevalenceSurveyForm?.id
                : currentPPSSurveyForm?.id;

        const orgUnitId = getOrgUnitByFormType();

        //Only Patient Forms are paginated.
        if (isPaginatedSurveyList(surveyFormType)) {
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
                        setSurveysError(err.message);
                        setLoadingSurveys(false);
                    }
                );
        } else {
            //Other forms are not paginated.
            compositionRoot.surveys.getSurveys
                .execute(surveyFormType, orgUnitId, parentSurveyId)
                .run(
                    surveys => {
                        setSurveys(surveys);
                        setLoadingSurveys(false);
                    },
                    err => {
                        setSurveysError(err.message);
                        setLoadingSurveys(false);
                    }
                );
        }
    }, [
        compositionRoot.surveys.getPaginatedSurveys,
        compositionRoot.surveys.getSurveys,
        surveyFormType,
        currentPPSSurveyForm,
        currentPrevalenceSurveyForm?.id,
        currentWardRegister,
        shouldRefreshSurveys,
        page,
        getOrgUnitByFormType,
    ]);

    return {
        surveys,
        loadingSurveys,
        errorSurveys: surveysError,
        setRefreshSurveys,
        page,
        setPage,
        pageSize,
        setPageSize,
        total,
        setTotal,
    };
}
