import { NamedRef, Id } from "./Ref";

export type SURVEY_FORM_TYPES =
    | "PPSSurveyForm"
    | "PPSCountryQuestionnaire"
    | "PPSHospitalForm"
    | "PPSPatientRegister"
    | "PPSWardRegister"
    | "PrevelancePlaceholder";

export type SURVEY_STATUSES = "FUTURE" | "ACTIVE" | "COMPLETED";
export type SURVEY_TYPES = "SUPRANATIONAL" | "NATIONAL" | "HOSP";

export interface SurveyBase extends NamedRef {
    surveyType: string;
}

export interface Survey extends SurveyBase {
    rootSurvey: SurveyBase; //For PPS module, all surveys are associated with a given PPS Survey Form instance.
    startDate?: Date;
    status: SURVEY_STATUSES;
    assignedOrgUnit: NamedRef;
    surveyFormType: SURVEY_FORM_TYPES;
    parentWardRegisterId?: Id;
}
