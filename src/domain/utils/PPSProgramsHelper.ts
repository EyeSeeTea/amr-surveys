import {
    PPS_COUNTRY_QUESTIONNAIRE_ID,
    PPS_HOSPITAL_FORM_ID,
    PPS_PATIENT_REGISTER_ID,
    PPS_SURVEY_FORM_ID,
    PPS_WARD_REGISTER_ID,
} from "../../data/repositories/SurveyFormD2Repository";
import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";

export const getProgramId = (surveyFormType: SURVEY_FORM_TYPES): string => {
    switch (surveyFormType) {
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
        default:
            throw new Error("Unknown Survey Type");
    }
};

export const getChildSurveyType = (
    surveyFormType: SURVEY_FORM_TYPES,
    ppsSurveyType?: string
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
        case "PPSPatientRegister":
        default:
            return undefined;
    }
};

export const getSurveyOptions = (
    surveyFormType: SURVEY_FORM_TYPES,
    ppsSurveyType?: string
): string[] => {
    switch (surveyFormType) {
        case "PPSSurveyForm": {
            switch (ppsSurveyType) {
                case "NATIONAL":
                    return ["Edit", "Add new Country", "List Country", "Delete"];
                case "HOSP":
                    return ["Edit", "Add new Hospital", "List Hospitals", "Delete"];
                case "SUPRANATIONAL":
                default:
                    return ["Edit", "Add new Country", "List Countries", "Delete"];
            }
        }
        case "PPSCountryQuestionnaire":
            return ["Edit", "Add new Hospital", "List Hospitals", "Delete"];
        case "PPSHospitalForm":
            return ["Edit", "Add new Ward", "List Wards", "Delete"];
        case "PPSWardRegister":
            return ["Edit", "Add new Patient", "List Patients", "Delete"];
        case "PPSPatientRegister":
        default:
            return ["Edit", "Delete"];
    }
};

export const getSurveyDisplayName = (surveyFormType: SURVEY_FORM_TYPES): string => {
    switch (surveyFormType) {
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
    currentPPSFormType: string,
    surveys: Survey[] | undefined
): boolean => {
    return (
        (surveyFormType === "PPSHospitalForm" && !isAdmin) ||
        // For PPS Survey Forms of National Type, only one child survey(country) should be allowed.
        (surveyFormType === "PPSCountryQuestionnaire" &&
            currentPPSFormType === "NATIONAL" &&
            surveys !== undefined &&
            surveys.length >= 1)
    );
};
