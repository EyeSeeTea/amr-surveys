import { Id } from "../../domain/entities/Ref";

//PPS Program Ids

export const PPS_SURVEY_FORM_ID = "OGOw5Kt3ytv";
export const PPS_COUNTRY_QUESTIONNAIRE_ID = "a4aYe2Eoaul";
export const PPS_HOSPITAL_FORM_ID = "mesnCzaLc7u";
export const PPS_PATIENT_REGISTER_ID = "GWcT6PN9NmI";
export const PPS_WARD_REGISTER_ID = "aIyAtgpYYrS";
//PPS Data element Ids

export const START_DATE_DATAELEMENT_ID = "OmkxlG2rNw3";
export const SURVEY_TYPE_DATAELEMENT_ID = "Oyi27xcPzAY";
export const SURVEY_COMPLETED_DATAELEMENT_ID = "KuGRIx3I16f";
export const SURVEY_ID_DATAELEMENT_ID = "JHw6Hs0T2Lb";
export const SURVEY_ID_PATIENT_DATAELEMENT_ID = "X2EkNfUHANO";
export const WARD_ID_DATAELEMENT_ID = "o4YMhVrXTeG";
export const WARD2_ID_DATAELEMENT_ID = "aSI3ZfIb3YS";
export const SURVEY_NAME_DATAELEMENT_ID = "mEQnAQQjdO8";
export const SURVEY_HOSPITAL_CODE_DATAELEMENT_ID = "uAe6Mlw2XlE";
export const SURVEY_WARD_CODE_DATAELEMENT_ID = "q4mg5z04dzd";
export const SURVEY_PATIENT_CODE_DATAELEMENT_ID = "yScrOW1eTvm";
//Prevalance Program Ids

export const PREVALENCE_SURVEY_FORM_ID = "WcSw803XiUk";
export const PREVALENCE_FACILITY_LEVEL_FORM_ID = "m404pwBZ4YT";
export const PREVALENCE_CASE_REPORT_FORM_ID = "i0msBbbQxYC";
export const PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID = "ew0mOwKdcJp";
export const PREVALENCE_CENTRAL_REF_LAB_FORM_ID = "aaAzYmn5vBG";
export const PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID = "KActa6iTwIM";
export const PREVALENCE_SUPRANATIONAL_REF_LAB_ID = "igEDINFwytu";
//Prevalence Data element Ids

export const AMR_SURVEYS_PREVALENCE_DEA_SURVEY_ID = "o6oNnIbpPDH";
export const SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID = "Log2Y4uqBBo";
export const AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF = "Wv5cTMAba6e";
export const AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL = "b9dqKVYm4Xn";
export const AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS = "w74wn7Wz2hV";
export const AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL = "mcY57Zn7FFl";
export const AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF = "tlRPoWumrSa";

export const PREVALENCE_START_DATE_DATAELEMENT_ID = "xlvLBmg9Mkg";
export const PREVELANCE_SURVEY_COMPLETED_DATAELEMENT_ID = "xiFcLr23IbW";
export const PREVELANCE_SURVEY_NAME_DATAELEMENT_ID = "HXnhZ8rsDts";
///Prevelance Tracked Entity Attribute types

export const PREVALANCE_FACILITY_LEVEL_TET = "eY4BDBKXegX";
export const PREVALANCE_CASE_REPORT_TET = "hyR1eTHLX8B";
export const PREVALANCE_SAMPLE_SHIPMENT_TET = "ukqXKDH1cqP";
export const PREVALANCE_CENTRAL_REF_LAB_TET = "yqa88gKCdV8";
export const PREVALANCE_PATHOGEN_ISOLATES_TET = "aWIdBmjFWF0";
export const PREVALANCE_SUPRANATIONAL_TET = "KQMBM3q32FC";
//Data Elements to hide
export const hiddenFields = ["Add new antibiotic"];
//To do : Move to datastore?
export const programsWithRepeatableSections = [
    PREVALENCE_SUPRANATIONAL_REF_LAB_ID,
    PREVALENCE_CENTRAL_REF_LAB_FORM_ID,
];
type SURVEY_DATA_ELEMENT_KEYS =
    | "startDate"
    | "surveyType"
    | "surveyCompleted"
    | "parentPPSSurveyId"
    | "surveyName"
    | "hospitalCode"
    | "wardCode"
    | "patientCode"
    | "parentWardRegisterId";
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
        dataElements: [SURVEY_COMPLETED_DATAELEMENT_ID, PREVELANCE_SURVEY_COMPLETED_DATAELEMENT_ID],
    },
    {
        key: "parentPPSSurveyId",
        dataElements: [
            SURVEY_ID_DATAELEMENT_ID,
            SURVEY_ID_PATIENT_DATAELEMENT_ID,
            AMR_SURVEYS_PREVALENCE_DEA_SURVEY_ID,
        ],
    },
    {
        key: "surveyName",
        dataElements: [SURVEY_NAME_DATAELEMENT_ID, PREVELANCE_SURVEY_NAME_DATAELEMENT_ID],
    },
    { key: "hospitalCode", dataElements: [SURVEY_HOSPITAL_CODE_DATAELEMENT_ID] },
    { key: "wardCode", dataElements: [SURVEY_WARD_CODE_DATAELEMENT_ID] },
    { key: "patientCode", dataElements: [SURVEY_PATIENT_CODE_DATAELEMENT_ID] },
    { key: "parentWardRegisterId", dataElements: [WARD_ID_DATAELEMENT_ID] },
];
