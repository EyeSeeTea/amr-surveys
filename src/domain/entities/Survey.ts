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

export interface Survey extends NamedRef {
    rootSurvey: {
        id: Id;
        name: string;
        surveyType: string;
    }; //For PPS module, all surveys are associated with a given PPS Survey Form instance.
    startDate?: Date;
    status: SURVEY_STATUSES;
    assignedOrgUnit: NamedRef;
    surveyType: string;
    surveyFormType: SURVEY_FORM_TYPES;
    parentWardRegisterId?: Id;
}
