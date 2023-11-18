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
    surveyType: SURVEY_FORM_TYPES
): SURVEY_FORM_TYPES | undefined => {
    switch (surveyType) {
        case "PPSSurveyForm":
            return "PPSCountryQuestionnaire";
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
                    return ["Edit", "Assign Country", "List Country"];
                case "HOSP":
                    return ["Edit", "Assign Hospital", "List Hospitals"];
                case "SUPRANATIONAL":
                default:
                    return ["Edit", "Assign Country", "List Countries"];
            }
        }
        case "PPSCountryQuestionnaire":
            return ["Edit", "Assign Hospital", "List Hospitals"];
        case "PPSHospitalForm":
            return ["Edit", "Assign Ward", "List Wards"];
        case "PPSWardRegister":
            return ["Edit", "Assign Patient", "List Patients"];
        case "PPSPatientRegister":
        default:
            return ["Edit"];
    }
};

