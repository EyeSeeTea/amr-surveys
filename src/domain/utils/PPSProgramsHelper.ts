import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";
import {
    DefaultFormOptions,
    OptionType,
    PPSCountryFormOptions,
    PPSHospitalFormOptions,
    PPSSurveyDefaultOptions,
    PPSSurveyHospitalOptions,
    PPSSurveyNationalOptions,
    PPSWardFormOptions,
    PrevalenceCaseReportFormOptions,
    PrevalenceFacilityLevelFormOptions,
    PrevalenceSurveyFormOptions,
} from "./optionsHelper";

export const PREVALENCE_PATIENT_OPTIONS = [
    "Case Report",
    "Sample Shipment",
    "Central Reference Lab Result",
    "Pathogen Isolates",
    "Supranational Result",
] as const;

export const getChildSurveyType = (
    surveyFormType: SURVEY_FORM_TYPES,
    ppsSurveyType?: string,
    option?: string
): SURVEY_FORM_TYPES | undefined => {
    switch (surveyFormType) {
        case "PPSSurveyForm": {
            switch (ppsSurveyType) {
                case "HOSP":
                    return "PPSHospitalForm";
                case "NATIONAL":
                case "SUPRANATIONAL":
                default:
                    return "PPSCountryQuestionnaire";
            }
        }
        case "PPSCountryQuestionnaire":
            return "PPSHospitalForm";
        case "PPSHospitalForm":
            return "PPSWardRegister";
        case "PPSWardRegister":
            return "PPSPatientRegister";
        case "PrevalenceSurveyForm":
            return "PrevalenceFacilityLevelForm";
        case "PrevalenceFacilityLevelForm":
            return "PrevalenceCaseReportForm";
        case "PrevalenceCaseReportForm": {
            switch (true) {
                case option === "New Sample Shipment":
                case option?.startsWith("List Sample Shipments"):
                    return "PrevalenceSampleShipTrackForm";

                case option === "New Central Ref Lab Results":
                case option?.startsWith("List Central Ref Labs Results"):
                    return "PrevalenceCentralRefLabForm";

                case option === "New Pathogen Isolates Log":
                case option?.startsWith("List Pathogen Isolates Logs"):
                    return "PrevalencePathogenIsolatesLog";

                case option === "New Supranational Ref Results":
                case option?.startsWith("List Supranational Refs Results"):
                    return "PrevalenceSupranationalRefLabForm";

                case option === "New D28 Follow-up":
                case option?.startsWith("List D28 Follow-up"):
                    return "PrevalenceD28FollowUp";

                case option === "New Discharge":
                case option?.startsWith("List Discharge - Clinical"):
                    return "PrevalenceDischargeClinical";

                case option === "New Cohort enrolment":
                case option?.startsWith("List Cohort enrolment"):
                    return "PrevalenceCohortEnrolment";

                default:
                    return undefined;
            }
        }
        case "PPSPatientRegister":
        default:
            return undefined;
    }
};

export const getSurveyOptions = (
    surveyFormType: SURVEY_FORM_TYPES,
    hasReadAccess: boolean,
    hasCaptureAccess: boolean,
    ppsSurveyType?: string
): OptionType[] => {
    switch (surveyFormType) {
        case "PPSSurveyForm": {
            switch (ppsSurveyType) {
                case "NATIONAL":
                    return PPSSurveyNationalOptions(hasReadAccess, hasCaptureAccess);
                case "HOSP":
                    return PPSSurveyHospitalOptions(hasReadAccess, hasCaptureAccess);
                case "SUPRANATIONAL":
                default:
                    return PPSSurveyDefaultOptions(hasReadAccess, hasCaptureAccess);
            }
        }
        case "PPSCountryQuestionnaire":
            return PPSCountryFormOptions(hasReadAccess, hasCaptureAccess);
        case "PPSHospitalForm":
            return PPSHospitalFormOptions(hasReadAccess, hasCaptureAccess);
        case "PPSWardRegister":
            return PPSWardFormOptions(hasReadAccess, hasCaptureAccess);

        case "PrevalenceSurveyForm":
            return PrevalenceSurveyFormOptions(hasReadAccess, hasCaptureAccess);

        case "PrevalenceFacilityLevelForm":
            return PrevalenceFacilityLevelFormOptions(hasReadAccess, hasCaptureAccess);

        case "PrevalenceCaseReportForm":
            return PrevalenceCaseReportFormOptions(hasReadAccess, hasCaptureAccess);
        case "PrevalenceSampleShipTrackForm":
        case "PrevalenceCentralRefLabForm":
        case "PrevalencePathogenIsolatesLog":
        case "PrevalenceSupranationalRefLabForm":
        case "PPSPatientRegister":
        case "PrevalenceD28FollowUp":
        case "PrevalenceDischargeClinical":
        case "PrevalenceCohortEnrolment":
        default:
            return DefaultFormOptions(hasReadAccess, hasCaptureAccess);
    }
};

export const getSurveyDisplayName = (surveyFormType: SURVEY_FORM_TYPES): string => {
    switch (surveyFormType) {
        //PPS module
        case "PPSSurveyForm":
            return "PPS Survey";
        case "PPSCountryQuestionnaire":
            return "Country";
        case "PPSHospitalForm":
            return "Hospital";
        case "PPSWardRegister":
            return "Ward";
        case "PPSPatientRegister":
            return "Patient";
        //Prevalence module
        case "PrevalenceSurveyForm":
            return "Prevalence Survey";
        case "PrevalenceFacilityLevelForm":
            return "Facility";
        case "PrevalenceCaseReportForm":
            return "Patient";
        case "PrevalenceSampleShipTrackForm":
            return "Sample Shipment";
        case "PrevalenceCentralRefLabForm":
            return "Central Reference Lab Result";
        case "PrevalencePathogenIsolatesLog":
            return "Pathogen Isolate";
        case "PrevalenceSupranationalRefLabForm":
            return "Supranational Result";
        case "PrevalenceD28FollowUp":
            return "D28 Follow-up";
        case "PrevalenceDischargeClinical":
            return "Discharge - Clinical";
        case "PrevalenceCohortEnrolment":
            return "Cohort Enrolment";
        default:
            return "Survey";
    }
};

export const getParentOUIdFromPath = (path: string | undefined) => {
    if (path) {
        const orgUnitsHeirarchy = path.split("/");
        const parentId = orgUnitsHeirarchy?.at(orgUnitsHeirarchy.length - 2);
        return parentId;
    } else return "";
};

export const hideCreateNewButton = (
    surveyFormType: SURVEY_FORM_TYPES,
    isAdmin: boolean,
    hasOnlyReadAccess: boolean,
    hasCaptureAccess: boolean,
    currentPPSFormType: string,
    surveys: Survey[] | undefined
): boolean => {
    return (
        hasOnlyReadAccess ||
        (surveyFormType === "PPSHospitalForm" && !isAdmin) ||
        // For PPS Survey Forms of National Type, only one child survey(country) should be allowed.
        (surveyFormType === "PPSCountryQuestionnaire" &&
            currentPPSFormType === "NATIONAL" &&
            surveys !== undefined &&
            surveys.length >= 1) ||
        (surveyFormType === "PrevalenceFacilityLevelForm" && !hasCaptureAccess) ||
        (surveyFormType === "PrevalenceSurveyForm" && !isAdmin)
    );
};

export const isPaginatedSurveyList = (surveyFormType: SURVEY_FORM_TYPES): boolean => {
    switch (surveyFormType) {
        case "PPSPatientRegister":
        case "PrevalenceCaseReportForm":
        case "PrevalenceCentralRefLabForm":
        case "PrevalencePathogenIsolatesLog":
        case "PrevalenceSampleShipTrackForm":
        case "PrevalenceSupranationalRefLabForm":
        case "PrevalenceD28FollowUp":
        case "PrevalenceCohortEnrolment":
        case "PrevalenceDischargeClinical":
            return true;
        default:
            return false;
    }
};

export const isPrevalencePatientChild = (surveyFormType: SURVEY_FORM_TYPES): boolean => {
    switch (surveyFormType) {
        case "PrevalenceCentralRefLabForm":
        case "PrevalencePathogenIsolatesLog":
        case "PrevalenceSampleShipTrackForm":
        case "PrevalenceSupranationalRefLabForm":
        case "PrevalenceD28FollowUp":
        case "PrevalenceDischargeClinical":
        case "PrevalenceCohortEnrolment":
            return true;
        default:
            return false;
    }
};
