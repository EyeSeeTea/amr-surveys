import { Id } from "../../domain/entities/Ref";
import { SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import {
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF,
    PPS_COUNTRY_QUESTIONNAIRE_ID,
    PPS_HOSPITAL_FORM_ID,
    PPS_PATIENT_REGISTER_ID,
    PPS_SURVEY_FORM_ID,
    PPS_WARD_REGISTER_ID,
    PREVALENCE_CASE_REPORT_TET,
    PREVALENCE_CENTRAL_REF_LAB_TET,
    PREVALENCE_FACILITY_LEVEL_TET,
    PREVALENCE_PATHOGEN_ISOLATES_TET,
    PREVALENCE_SAMPLE_SHIPMENT_TET,
    PREVALENCE_SUPRANATIONAL_TET,
    PREVALENCE_CASE_REPORT_FORM_ID,
    PREVALENCE_CENTRAL_REF_LAB_FORM_ID,
    PREVALENCE_FACILITY_LEVEL_FORM_ID,
    PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID,
    PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID,
    PREVALENCE_SUPRANATIONAL_REF_LAB_ID,
    PREVALENCE_SURVEY_FORM_ID,
    SURVEY_ID_DATAELEMENT_ID,
    SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID,
    WARD_ID_DATAELEMENT_ID,
} from "../entities/D2Survey";

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

export const getTrackedEntityAttributeType = (programId: Id) => {
    switch (programId) {
        case PREVALENCE_CASE_REPORT_FORM_ID:
            return PREVALENCE_CASE_REPORT_TET;
        case PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID:
            return PREVALENCE_SAMPLE_SHIPMENT_TET;
        case PREVALENCE_CENTRAL_REF_LAB_FORM_ID:
            return PREVALENCE_CENTRAL_REF_LAB_TET;
        case PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID:
            return PREVALENCE_PATHOGEN_ISOLATES_TET;
        case PREVALENCE_SUPRANATIONAL_REF_LAB_ID:
            return PREVALENCE_SUPRANATIONAL_TET;
        case PREVALENCE_FACILITY_LEVEL_FORM_ID:
            return PREVALENCE_FACILITY_LEVEL_TET;

        default:
            return "";
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
        case PREVALENCE_FACILITY_LEVEL_FORM_ID:
            return SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID;
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
        case PPS_COUNTRY_QUESTIONNAIRE_ID:
        case PPS_HOSPITAL_FORM_ID:
        case PPS_WARD_REGISTER_ID:
            return SURVEY_ID_DATAELEMENT_ID;
        case PPS_PATIENT_REGISTER_ID:
            return WARD_ID_DATAELEMENT_ID;

        default:
            return "";
    }
};

export const getChildProgramId = (
    programId: Id
): { type: "singleChild"; value: Id } | { type: "multipleChildren"; value: Id[] } => {
    switch (programId) {
        case PPS_SURVEY_FORM_ID:
            return { type: "singleChild", value: PPS_COUNTRY_QUESTIONNAIRE_ID };
        case PPS_COUNTRY_QUESTIONNAIRE_ID:
            return { type: "singleChild", value: PPS_HOSPITAL_FORM_ID };
        case PPS_HOSPITAL_FORM_ID:
            return { type: "singleChild", value: PPS_WARD_REGISTER_ID };
        case PPS_WARD_REGISTER_ID:
            return { type: "singleChild", value: PPS_PATIENT_REGISTER_ID };

        case PREVALENCE_SURVEY_FORM_ID:
            return { type: "singleChild", value: PREVALENCE_FACILITY_LEVEL_FORM_ID };
        case PREVALENCE_FACILITY_LEVEL_FORM_ID:
            return { type: "singleChild", value: PREVALENCE_CASE_REPORT_FORM_ID };
        case PREVALENCE_CASE_REPORT_FORM_ID:
            return {
                type: "multipleChildren",
                value: [
                    PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID,
                    PREVALENCE_CENTRAL_REF_LAB_FORM_ID,
                    PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID,
                    PREVALENCE_SUPRANATIONAL_REF_LAB_ID,
                ],
            };
        default:
            return { type: "singleChild", value: "" };
    }
};

export const getSurveyType = (surveyFormType: SURVEY_FORM_TYPES): "PPS" | "Prevalence" => {
    switch (surveyFormType) {
        case "PPSSurveyForm":
        case "PPSCountryQuestionnaire":
        case "PPSHospitalForm":
        case "PPSWardRegister":
        case "PPSPatientRegister":
            return "PPS";
        case "PrevalenceSurveyForm":
        case "PrevalenceFacilityLevelForm":
        case "PrevalenceCaseReportForm":
        case "PrevalenceSampleShipTrackForm":
        case "PrevalenceCentralRefLabForm":
        case "PrevalencePathogenIsolatesLog":
        case "PrevalenceSupranationalRefLabForm":
        default:
            return "Prevalence";
    }
};
