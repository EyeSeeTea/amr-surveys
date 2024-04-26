import { useCallback } from "react";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { getUserAccess } from "../../../domain/utils/menuHelper";
import { useCurrentModule } from "../../contexts/current-module-context";
import { useAppContext } from "../../contexts/app-context";

export function useRedirectHome() {
    const {
        currentPPSSurveyForm,
        currentPrevalenceSurveyForm,
        currentCountryQuestionnaire,
        currentHospitalForm,
        currentWardRegister,
        currentFacilityLevelForm,
        currentCaseReportForm,
    } = useCurrentSurveys();

    const { currentModule } = useCurrentModule();

    const {
        currentUser: { userGroups },
    } = useAppContext();

    const shouldRedirectToHome = useCallback(
        (formType: SURVEY_FORM_TYPES): boolean => {
            const hasAdminAccess = currentModule
                ? getUserAccess(currentModule, userGroups).hasAdminAccess
                : false;

            if (
                (formType === "PPSCountryQuestionnaire" && !currentPPSSurveyForm) ||
                (hasAdminAccess &&
                    formType === "PPSHospitalForm" &&
                    !currentCountryQuestionnaire) ||
                (formType === "PPSWardRegister" && !currentHospitalForm) ||
                (formType === "PPSPatientRegister" && !currentWardRegister) ||
                (hasAdminAccess &&
                    formType === "PrevalenceFacilityLevelForm" &&
                    !currentPrevalenceSurveyForm) ||
                (formType === "PrevalenceCaseReportForm" && !currentFacilityLevelForm) ||
                ((formType === "PrevalenceCentralRefLabForm" ||
                    formType === "PrevalencePathogenIsolatesLog" ||
                    formType === "PrevalenceSampleShipTrackForm" ||
                    formType === "PrevalenceSupranationalRefLabForm") &&
                    !currentCaseReportForm)
            )
                return true;
            else return false;
        },
        [
            currentModule,
            userGroups,
            currentPPSSurveyForm,
            currentCountryQuestionnaire,
            currentHospitalForm,
            currentWardRegister,
            currentPrevalenceSurveyForm,
            currentFacilityLevelForm,
            currentCaseReportForm,
        ]
    );

    return { shouldRedirectToHome };
}
