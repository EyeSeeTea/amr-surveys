import { useCallback, useEffect, useState } from "react";
import { Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { useAppContext } from "../contexts/app-context";
import { useCurrentSurveys } from "../contexts/current-surveys-context";
import { isPaginatedSurveyList } from "../../domain/utils/PPSProgramsHelper";
import { getUserAccess } from "../../domain/utils/menuHelper";
import { useCurrentModule } from "../contexts/current-module-context";
import { GLOBAL_OU_ID } from "../../domain/usecases/SaveFormDataUseCase";
import i18n from "../../utils/i18n";

const PAGE_SIZE = 10;
export function useSurveys(surveyFormType: SURVEY_FORM_TYPES) {
    const { compositionRoot, prevalenceHospitals } = useAppContext();
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
                // default to GLOBAL_OU_ID for "HOSP" since there is no country to use as OrgUnit
                return currentPPSSurveyForm?.surveyType === "HOSP"
                    ? GLOBAL_OU_ID
                    : currentCountryQuestionnaire?.orgUnitId;
            case "PPSWardRegister":
            case "PPSPatientRegister":
                return currentHospitalForm?.orgUnitId;
            case "PrevalenceFacilityLevelForm":
                return isAdmin
                    ? currentPrevalenceSurveyForm?.orgUnitId
                    : currentPrevalenceHospitals;
            case "PrevalenceCaseReportForm":
            case "PrevalenceCentralRefLabForm":
            case "PrevalencePathogenIsolatesLog":
            case "PrevalenceSampleShipTrackForm":
            case "PrevalenceSupranationalRefLabForm":
            case "PrevalenceD28FollowUp":
            case "PrevalenceCohortEnrolment":
            case "PrevalenceDischargeClinical":
            case "PrevalenceDischargeEconomic":
                return currentFacilityLevelForm?.orgUnitId;
            case "PrevalenceSurveyForm":
                return undefined;
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
        currentPPSSurveyForm?.surveyType,
    ]);

    useEffect(() => {
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
                  surveyFormType === "PrevalenceSupranationalRefLabForm" ||
                  surveyFormType === "PrevalenceCohortEnrolment" ||
                  surveyFormType === "PrevalenceDischargeClinical" ||
                  surveyFormType === "PrevalenceDischargeEconomic" ||
                  surveyFormType === "PrevalenceD28FollowUp"
                ? currentPrevalenceSurveyForm?.id
                : surveyFormType === "PPSPatientRegister"
                ? currentWardRegister?.id
                : currentPPSSurveyForm?.id;

        const orgUnitId = getOrgUnitByFormType();

        if (!orgUnitId && surveyFormType !== "PrevalenceSurveyForm") {
            setSurveysError(i18n.t("Could not resolve Org Unit for current form"));
            return;
        }

        setLoadingSurveys(true);

        //Only Patient Forms are paginated.
        if (isPaginatedSurveyList(surveyFormType)) {
            compositionRoot.surveys.getPaginatedSurveys
                .execute({
                    surveyFormType: surveyFormType,
                    orgUnitId: orgUnitId || "",
                    currentModule: currentModule,
                    parentSurveyId: parentSurveyId,
                    parentWardRegisterId: currentWardRegister?.id,
                    parentPatientId: currentCaseReportForm?.id,
                    page: page,
                    pageSize: PAGE_SIZE,
                })
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
        } else {
            const makeChunkedCall: boolean =
                surveyFormType === "PrevalenceFacilityLevelForm" && !isAdmin;
            //Other forms are not paginated.
            compositionRoot.surveys.getSurveys
                .execute(surveyFormType, orgUnitId || "", parentSurveyId, makeChunkedCall)
                .run(
                    nonPaginatedSurveys => {
                        setSurveys(nonPaginatedSurveys);
                        setLoadingSurveys(false);
                    },
                    err => {
                        //@ts-ignore
                        setSurveysError(err.message || err?.response.data.message);
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
        currentCaseReportForm?.id,
        currentModule,
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
