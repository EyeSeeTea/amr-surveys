import { NamedRef, Ref, Id } from "./Ref";

export type SURVEY_FORM_TYPES =
    | "PPSSurveyForm"
    | "PPSCountryQuestionnaire"
    | "PPSHospitalForm"
    | "PPSPatientRegister"
    | "PPSWardRegister";

export type SURVEY_STATUS = "FUTURE" | "ACTIVE" | "COMPLETED";
export interface Survey extends Ref {
    parentSurveyId?: Id;
    startDate?: Date;
    status: SURVEY_STATUS;
    assignedOrgUnit: NamedRef;
    surveyType: string;
}
