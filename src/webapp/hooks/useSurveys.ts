import { useCallback, useEffect, useState } from "react";
import { Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { useAppContext } from "../contexts/app-context";
import { useCurrentSurveys } from "../contexts/current-surveys-context";
import { getUserAccess } from "../../domain/utils/menuHelper";
import { useCurrentModule } from "../contexts/current-module-context";
import { GLOBAL_OU_ID } from "../../domain/usecases/SaveFormDataUseCase";
import { PAGE_SIZE, SortColumnDetails, SortDirection } from "../../domain/entities/TablePagination";

export function useSurveys(
    surveyFormType: SURVEY_FORM_TYPES,
    page: number,
    setPageSize: React.Dispatch<React.SetStateAction<number>>,
    setTotal: React.Dispatch<React.SetStateAction<number | undefined>>,
    sortDetails?: SortColumnDetails
) {
    const { compositionRoot, prevalenceHospitals } = useAppContext();
    const [surveys, setSurveys] = useState<Survey[]>();
    const [loadingSurveys, setLoadingSurveys] = useState(false);
    const [surveysError, setSurveysError] = useState<string>();
    const [shouldRefreshSurveys, setRefreshSurveys] = useState({});

    //states for column sort
    // const [surveyNameSortDirection, setSurveyNameSortDirection] = useState<SortDirection>("asc");
    // const [patientIdSortDirection, setPatientIdSortDirection] = useState<SortDirection>("asc");
    // const [patientCodeSortDirection, setPatientCodeSortDirection] = useState<SortDirection>("asc");
    // const [startDateSortDirection, setStartDateSortDirection] = useState<SortDirection>("asc");
    // const [statusSortDirection, setStatusSortDirection] = useState<SortDirection>("asc");
    // const [surveyTypeSortDirection, setSurveyTypeSortDirection] = useState<SortDirection>("asc");
    // const [wardCodeSortDirection, setWardCodeSortDirection] = useState<SortDirection>("asc");
    // const [hospitalCodeSortDirection, setHospitalCodeSortDirection] =
    //     useState<SortDirection>("asc");

    const {
        currentPPSSurveyForm,
        currentCountryQuestionnaire,
        currentHospitalForm,
        currentWardRegister,
        currentPrevalenceSurveyForm,
        currentFacilityLevelForm,
        currentCaseReportForm,
    } = useCurrentSurveys();

    const { currentModule } = useCurrentModule();
    const {
        currentUser: { userGroups },
    } = useAppContext();

    const isAdmin = currentModule ? getUserAccess(currentModule, userGroups).hasAdminAccess : false;

    const getOrgUnitByFormType = useCallback(() => {
        const currentPrevalenceHospitals = prevalenceHospitals
            .filter(hospitals => hospitals.readAccess && hospitals.captureAccess)
            .map(hospital => hospital.orgUnitId)
            .join(";");

        switch (surveyFormType) {
            case "PPSHospitalForm":
                return currentCountryQuestionnaire?.orgUnitId ?? "";
            case "PPSWardRegister":
            case "PPSPatientRegister":
                return currentHospitalForm?.orgUnitId ?? "";

            case "PrevalenceFacilityLevelForm":
                return isAdmin
                    ? currentPrevalenceSurveyForm?.orgUnitId ?? ""
                    : currentPrevalenceHospitals;
            case "PrevalenceCaseReportForm":
            case "PrevalenceCentralRefLabForm":
            case "PrevalencePathogenIsolatesLog":
            case "PrevalenceSampleShipTrackForm":
            case "PrevalenceSupranationalRefLabForm":
            case "PrevalenceD28FollowUp":
            case "PrevalenceCohortEnrolment":
            case "PrevalenceDischarge":
                return currentFacilityLevelForm?.orgUnitId ?? "";

            default:
                return GLOBAL_OU_ID;
        }
    }, [
        currentCountryQuestionnaire?.orgUnitId,
        currentFacilityLevelForm?.orgUnitId,
        currentHospitalForm?.orgUnitId,
        currentPrevalenceSurveyForm?.orgUnitId,
        isAdmin,
        prevalenceHospitals,
        surveyFormType,
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
                : surveyFormType === "PPSPatientRegister"
                ? currentWardRegister?.id
                : currentPPSSurveyForm?.id;

        const orgUnitId = getOrgUnitByFormType();

        const makeChunkedCall: boolean =
            surveyFormType === "PrevalenceFacilityLevelForm" && !isAdmin;

        compositionRoot.surveys.getPaginatedSurveys
            .execute(
                surveyFormType,
                orgUnitId,
                parentSurveyId,
                currentWardRegister?.id,
                currentCaseReportForm?.id,
                page,
                PAGE_SIZE,
                makeChunkedCall,
                sortDetails
            )
            .run(
                paginatedSurveys => {
                    setSurveys(paginatedSurveys.objects);
                    setTotal(paginatedSurveys.pager.total);
                    setPageSize(paginatedSurveys.pager.pageSize);
                    setLoadingSurveys(false);
                },
                err => {
                    //@ts-ignore
                    setSurveysError(err.message || err.response?.data.message);
                    setLoadingSurveys(false);
                }
            );
    }, [
        compositionRoot.surveys.getPaginatedSurveys,
        surveyFormType,
        currentPPSSurveyForm,
        currentPrevalenceSurveyForm?.id,
        currentWardRegister,
        shouldRefreshSurveys,
        getOrgUnitByFormType,
        isAdmin,
        currentCaseReportForm?.id,
        page,
        setPageSize,
        setTotal,
        sortDetails,
    ]);

    return {
        surveys,
        loadingSurveys,
        errorSurveys: surveysError,
        setRefreshSurveys,
    };
}
