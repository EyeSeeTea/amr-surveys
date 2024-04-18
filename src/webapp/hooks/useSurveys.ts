import { useCallback, useEffect, useState } from "react";
import { Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { useAppContext } from "../contexts/app-context";
import { useCurrentSurveys } from "../contexts/current-surveys-context";
import { isPaginatedSurveyList } from "../../domain/utils/PPSProgramsHelper";
import { getUserAccess } from "../../domain/utils/menuHelper";
import { useCurrentModule } from "../contexts/current-module-context";
import { useHospitalContext } from "../contexts/hospital-context";

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

    const { currentModule } = useCurrentModule();
    const {
        currentUser: { userGroups },
    } = useAppContext();
    const { userHospitalsAccess } = useHospitalContext();
    const isAdmin = currentModule ? getUserAccess(currentModule, userGroups).hasAdminAccess : false;

    const getOrgUnitByFormType = useCallback(() => {
        //TO DO : make chunked calls as user may have large number of hospitals.
        //TO DO : do not make call for PrevalenceFacilityLevelForm until userHospitalsAccess data is loaded.
        const currentUserHospitals = userHospitalsAccess
            .filter(hospitals => hospitals.readAccess === true)
            .map(hospital => hospital.orgUnitId)
            .join(";");
        const hasAdminAccess = currentModule
            ? getUserAccess(currentModule, userGroups).hasAdminAccess
            : false;

        switch (surveyFormType) {
            case "PPSHospitalForm":
                return currentCountryQuestionnaire?.orgUnitId ?? "";
            case "PPSWardRegister":
            case "PPSPatientRegister":
                return currentHospitalForm?.orgUnitId ?? "";

            case "PrevalenceFacilityLevelForm":
                return hasAdminAccess
                    ? currentPrevalenceSurveyForm?.orgUnitId ?? ""
                    : currentUserHospitals;
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
        currentModule,
        currentPrevalenceSurveyForm?.orgUnitId,
        surveyFormType,
        userGroups,
        userHospitalsAccess,
    ]);

    useEffect(() => {
        setLoadingSurveys(true);

        const parentSurveyId =
            !isAdmin &&
            (surveyFormType === "PrevalenceFacilityLevelForm" ||
                surveyFormType === "PPSHospitalForm") //Non admin users , do not have parent survey form.
                ? undefined
                : surveyFormType === "PrevalenceFacilityLevelForm" ||
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
        isAdmin,
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
