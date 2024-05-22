import {
    PPS_COUNTRY_QUESTIONNAIRE_ID,
    PPS_HOSPITAL_FORM_ID,
    PPS_PATIENT_REGISTER_ID,
    PPS_SURVEY_FORM_ID,
    PPS_WARD_REGISTER_ID,
    PREVALENCE_CASE_REPORT_FORM_ID,
    PREVALENCE_CENTRAL_REF_LAB_FORM_ID,
    PREVALENCE_FACILITY_LEVEL_FORM_ID,
    PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID,
    PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID,
    PREVALENCE_SUPRANATIONAL_REF_LAB_ID,
    PREVALENCE_SURVEY_FORM_ID,
} from "../../data/entities/D2Survey";
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

export const getProgramId = (surveyFormType: SURVEY_FORM_TYPES): string => {
    switch (surveyFormType) {
        //PPS Module
        case "PPSSurveyForm":
            return PPS_SURVEY_FORM_ID;
        case "PPSCountryQuestionnaire":
            return PPS_COUNTRY_QUESTIONNAIRE_ID;
        case "PPSHospitalForm":
            return PPS_HOSPITAL_FORM_ID;
        case "PPSPatientRegister":
            return PPS_PATIENT_REGISTER_ID;
        case "PPSWardRegister":
            return PPS_WARD_REGISTER_ID;

        //Prevalence Module
        case "PrevalenceSurveyForm":
            return PREVALENCE_SURVEY_FORM_ID;
        case "PrevalenceFacilityLevelForm":
            return PREVALENCE_FACILITY_LEVEL_FORM_ID;
        case "PrevalenceCaseReportForm":
            return PREVALENCE_CASE_REPORT_FORM_ID;
        case "PrevalenceSampleShipTrackForm":
            return PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID;
        case "PrevalenceCentralRefLabForm":
            return PREVALENCE_CENTRAL_REF_LAB_FORM_ID;
        case "PrevalencePathogenIsolatesLog":
            return PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID;
        case "PrevalenceSupranationalRefLabForm":
            return PREVALENCE_SUPRANATIONAL_REF_LAB_ID;

        default:
            throw new Error("Unknown Survey Type");
    }
};

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
                case option === "Add New Sample Shipment":
                case option?.startsWith("List Sample Shipments"):
                    return "PrevalenceSampleShipTrackForm";

                case option === "Add New Central Ref Lab Results":
                case option?.startsWith("List Central Ref Labs Results"):
                    return "PrevalenceCentralRefLabForm";

                case option === "Add New Pathogen Isolates Log":
                case option?.startsWith("List Pathogen Isolates Logs"):
                    return "PrevalencePathogenIsolatesLog";

                case option === "Add New Supranational Ref Results":
                case option?.startsWith("List Supranational Refs Results"):
                    return "PrevalenceSupranationalRefLabForm";
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
    hasReadAccess: boolean,
    currentPPSFormType: string,
    surveys: Survey[] | undefined
): boolean => {
    return (
        hasReadAccess ||
        (surveyFormType === "PPSHospitalForm" && !isAdmin) ||
        // For PPS Survey Forms of National Type, only one child survey(country) should be allowed.
        (surveyFormType === "PPSCountryQuestionnaire" &&
            currentPPSFormType === "NATIONAL" &&
            surveys !== undefined &&
            surveys.length >= 1) ||
        (surveyFormType === "PrevalenceFacilityLevelForm" && !isAdmin)
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
            return true;
        default:
            return false;
    }
};
