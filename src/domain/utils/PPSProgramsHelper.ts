import {
    PPS_COUNTRY_QUESTIONNAIRE_ID,
    PPS_HOSPITAL_FORM_ID,
    PPS_PATIENT_REGISTER_ID,
    PPS_SURVEY_FORM_ID,
    PPS_WARD_REGISTER_ID,
} from "../../data/repositories/SurveyFormD2Repository";
import { SURVEY_FORM_TYPES } from "../entities/Survey";

export const getProgramId = (surveyType: SURVEY_FORM_TYPES): string => {
    switch (surveyType) {
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
    surveyType: SURVEY_FORM_TYPES,
    ppsSurveyType?: string
): SURVEY_FORM_TYPES | undefined => {
    switch (surveyType) {
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
    surveyType: SURVEY_FORM_TYPES,
    ppsSurveyType?: string
): string[] => {
    switch (surveyType) {
        case "PPSSurveyForm": {
            switch (ppsSurveyType) {
                case "NATIONAL":
                    return ["Edit", "Add new Country", "List Country"];
                case "HOSP":
                    return ["Edit", "Add new Hospital", "List Hospitals"];
                case "SUPRANATIONAL":
                default:
                    return ["Edit", "Add new Country", "List Countries"];
            }
        }
        case "PPSCountryQuestionnaire":
            return ["Edit", "Add new Hospital", "List Hospitals"];
        case "PPSHospitalForm":
            return ["Edit", "Add new Ward", "List Wards"];
        case "PPSWardRegister":
            return ["Edit", "Add new Patient", "List Patients"];
        case "PPSPatientRegister":
        default:
            return ["Edit"];
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
