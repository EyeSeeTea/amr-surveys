import { Id } from "../../domain/entities/Ref";

//PPS Program Ids

export const PPS_SURVEY_FORM_ID = "OGOw5Kt3ytv";
export const PPS_COUNTRY_QUESTIONNAIRE_ID = "a4aYe2Eoaul";
export const PPS_HOSPITAL_FORM_ID = "mesnCzaLc7u";
export const PPS_PATIENT_REGISTER_ID = "ceSJyvSGyHm";
export const PPS_WARD_REGISTER_ID = "aIyAtgpYYrS";
//PPS Data element Ids

export const START_DATE_DATAELEMENT_ID = "OmkxlG2rNw3";
export const SURVEY_TYPE_DATAELEMENT_ID = "Oyi27xcPzAY";
export const SURVEY_COMPLETED_DATAELEMENT_ID = "KuGRIx3I16f";
export const SURVEY_ID_DATAELEMENT_ID = "JHw6Hs0T2Lb";
export const SURVEY_ID_PATIENT_TEA_ID = "Yc0jYZn0lwa";
export const WARD_ID_TEA_ID = "pUZFmyeWHZa";
export const WARD2_ID_DATAELEMENT_ID = "aSI3ZfIb3YS";
export const SURVEY_NAME_DATAELEMENT_ID = "mEQnAQQjdO8";
export const SURVEY_HOSPITAL_CODE_DATAELEMENT_ID = "uAe6Mlw2XlE";
export const SURVEY_WARD_CODE_DATAELEMENT_ID = "q4mg5z04dzd";
export const SURVEY_PATIENT_CODE_TEA_ID = "qX450py29V3";
export const SURVEY_PATIENT_ID_TEA_ID = "HkBG3DVELBM";
//Prevalence Program Ids

export const PREVALENCE_SURVEY_FORM_ID = "WcSw803XiUk";
export const PREVALENCE_FACILITY_LEVEL_FORM_ID = "m404pwBZ4YT";
export const PREVALENCE_CASE_REPORT_FORM_ID = "i0msBbbQxYC";
export const PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID = "ew0mOwKdcJp";
export const PREVALENCE_CENTRAL_REF_LAB_FORM_ID = "aaAzYmn5vBG";
export const PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID = "KActa6iTwIM";
export const PREVALENCE_SUPRANATIONAL_REF_LAB_ID = "igEDINFwytu";
export const PREVALENCE_MORTALITY_FOLLOWUP_FORM_D28 = "OMrD1jbnhxr";
export const PREVALENCE_MORTALITY_DISCHARGE_FORM = "GSmQGiIkUGh";
export const PREVALENCE_MORTALITY_COHORT_ENORL_FORM = "e4Yp0x3cgZF";

//Prevalence Data element Ids

export const AMR_SURVEYS_PREVALENCE_DEA_SURVEY_ID = "o6oNnIbpPDH";
export const SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID = "Log2Y4uqBBo";
export const AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF = "Wv5cTMAba6e";
export const AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL = "b9dqKVYm4Xn";
export const AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS = "w74wn7Wz2hV";
export const AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL = "mcY57Zn7FFl";
export const AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF = "tlRPoWumrSa";
export const AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID = "yEkJlUFeJdP";

export const AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_FUP = "HIrhj9B0fOf";
export const AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_DF = "C8Lhx4ozGEP";
export const AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_COH = "fI1qhkRwwm7";
export const AMR_SURVEYS_MORTALITY_TEA_PAT_ID_FUP2 = "l4Y96YlhYyF";
export const AMR_SURVEYS_MORTALITY_TEA_PAT_ID_DF2 = "oT6f0BG74xs";
export const AMR_SURVEYS_MORTALITY_TEA_PAT_ID_COH2 = "mGYxog3at84";

export const PREVALENCE_START_DATE_DATAELEMENT_ID = "xlvLBmg9Mkg";
export const PREVALENCE_SURVEY_COMPLETED_DATAELEMENT_ID = "xiFcLr23IbW";
export const PREVALENCE_SURVEY_NAME_DATAELEMENT_ID = "HXnhZ8rsDts";
export const AMR_SURVEYS_PREVALENCE_DEA_AST_GUIDELINES = "SmuESJHyhC2";
export const AMR_SURVEYS_PREVALENCE_DEA_CUSTOM_AST_GUIDE = "lyeNV8Ag6lp";

export const AMR_SURVEYS_PREVALENCE_TEA_PATIENT_ID = "mUaaSzbeMmj";
export const AMR_SURVEYS_PREVALENCE_TEA_AMRPATIENT_IDPREVALENCE = "M1D2XXokPWl";
export const AMR_SURVEYS_PREVALENCE_TEA_PATIENT_IDA19 = "yq8en6ZkENB";

export const AMR_SURVEYS_PREVALENCE_TEA_HOSPITAL_ID = "hpNIfydqgkD";

//Prevalence Tracked Entity Attribute types
export const PREVALENCE_FACILITY_LEVEL_TET = "eY4BDBKXegX";
export const PREVALENCE_CASE_REPORT_TET = "hyR1eTHLX8B";
export const PREVALENCE_SAMPLE_SHIPMENT_TET = "ukqXKDH1cqP";
export const PREVALENCE_CENTRAL_REF_LAB_TET = "yqa88gKCdV8";
export const PREVALENCE_PATHOGEN_ISOLATES_TET = "aWIdBmjFWF0";
export const PREVALENCE_SUPRANATIONAL_TET = "KQMBM3q32FC";
export const PREVALENCE_MORTALITY_FOLLOW_UP_TET = "m8YpTxNjHbn";
export const PPS_PATIENT_TET = "EHN9A3tEP5s";

type SURVEY_DATA_ELEMENT_KEYS =
    | "startDate"
    | "surveyType"
    | "surveyCompleted"
    | "parentPPSSurveyId"
    | "surveyName"
    | "hospitalCode"
    | "wardCode"
    | "patientId"
    | "patientCode"
    | "parentWardRegisterId"
    | "uniqueSurveyPatientId"
    | "astGuideline"
    | "customAstGuideline";
interface SurveyKeyDataElementMapType {
    key: SURVEY_DATA_ELEMENT_KEYS;
    dataElements: Id[];
}
export const keyToDataElementMap: SurveyKeyDataElementMapType[] = [
    {
        key: "startDate",
        dataElements: [START_DATE_DATAELEMENT_ID, PREVALENCE_START_DATE_DATAELEMENT_ID],
    },
    { key: "surveyType", dataElements: [SURVEY_TYPE_DATAELEMENT_ID] },
    {
        key: "surveyCompleted",
        dataElements: [SURVEY_COMPLETED_DATAELEMENT_ID, PREVALENCE_SURVEY_COMPLETED_DATAELEMENT_ID],
    },
    {
        key: "parentPPSSurveyId",
        dataElements: [
            SURVEY_ID_DATAELEMENT_ID,
            SURVEY_ID_PATIENT_TEA_ID,
            AMR_SURVEYS_PREVALENCE_DEA_SURVEY_ID,
        ],
    },
    {
        key: "surveyName",
        dataElements: [SURVEY_NAME_DATAELEMENT_ID, PREVALENCE_SURVEY_NAME_DATAELEMENT_ID],
    },
    { key: "hospitalCode", dataElements: [SURVEY_HOSPITAL_CODE_DATAELEMENT_ID] },
    { key: "wardCode", dataElements: [SURVEY_WARD_CODE_DATAELEMENT_ID] },
    { key: "patientId", dataElements: [SURVEY_PATIENT_ID_TEA_ID] },
    { key: "patientCode", dataElements: [SURVEY_PATIENT_CODE_TEA_ID] },
    { key: "parentWardRegisterId", dataElements: [WARD_ID_TEA_ID] },
    { key: "uniqueSurveyPatientId", dataElements: [AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID] },
    { key: "astGuideline", dataElements: [AMR_SURVEYS_PREVALENCE_DEA_AST_GUIDELINES] },
    { key: "customAstGuideline", dataElements: [AMR_SURVEYS_PREVALENCE_DEA_CUSTOM_AST_GUIDE] },
];

//ParentPrevalenceSurveyId Fields
export const parentPrevalenceSurveyIdList = [
    SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF,
    AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_FUP,
    AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_DF,
    AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_COH,
];

export const patientIdList = [
    AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID,
    AMR_SURVEYS_PREVALENCE_TEA_PATIENT_ID,
    AMR_SURVEYS_PREVALENCE_TEA_AMRPATIENT_IDPREVALENCE,
    AMR_SURVEYS_PREVALENCE_TEA_PATIENT_IDA19,
    AMR_SURVEYS_MORTALITY_TEA_PAT_ID_FUP2,
    AMR_SURVEYS_MORTALITY_TEA_PAT_ID_DF2,
    AMR_SURVEYS_MORTALITY_TEA_PAT_ID_COH2,
    SURVEY_PATIENT_ID_TEA_ID,
];
