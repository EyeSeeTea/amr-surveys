import { Id } from "../../domain/entities/Ref";
import { SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import {
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF,
    PREVALENCE_CASE_REPORT_FORM_ID,
    PREVALENCE_CENTRAL_REF_LAB_FORM_ID,
    PREVALENCE_FACILITY_LEVEL_FORM_ID,
    PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID,
    PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID,
    PREVALENCE_SUPRANATIONAL_REF_LAB_ID,
} from "../repositories/SurveyFormD2Repository";

export const isTrackerProgram = (programId: Id) => {
    switch (programId) {
        case PREVALENCE_FACILITY_LEVEL_FORM_ID:
        case PREVALENCE_CASE_REPORT_FORM_ID:
        case PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID:
        case PREVALENCE_CENTRAL_REF_LAB_FORM_ID:
        case PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID:
        case PREVALENCE_SUPRANATIONAL_REF_LAB_ID:
            return true;
        default:
            return false;
    }
};

export const getSurveyNameBySurveyFormType = (
    surveyFormType: SURVEY_FORM_TYPES,
    options: {
        eventId: string;
        surveyName: string;
        orgUnitName: string | undefined;
        hospitalCode: string;
        wardCode: string;
        patientCode: string;
    }
): string => {
    switch (surveyFormType) {
        case "PPSSurveyForm":
            return options.surveyName !== "" ? options.surveyName : options.eventId;
        case "PPSCountryQuestionnaire":
            return options.orgUnitName && options.orgUnitName !== ""
                ? options.orgUnitName
                : options.eventId;
        case "PPSHospitalForm":
            return options.hospitalCode !== "" ? options.hospitalCode : options.eventId;
        case "PPSWardRegister":
            return options.wardCode !== "" ? options.wardCode : options.eventId;
        case "PPSPatientRegister":
            return options.patientCode !== "" ? options.patientCode : options.eventId;
        default:
            return "";
    }
};

export const getParentDataElementForProgram = (programId: Id): Id => {
    switch (programId) {
        case PREVALENCE_CASE_REPORT_FORM_ID:
            return AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF;
        case PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID:
            return AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF;
        case PREVALENCE_CENTRAL_REF_LAB_FORM_ID:
            return AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL;

        case PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID:
            return AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS;
        case PREVALENCE_SUPRANATIONAL_REF_LAB_ID:
            return AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL;
        default:
            return "";
    }
};
