import { NamedRef, Ref, Id } from "./Ref";

export type SURVEY_FORM_TYPES =
    | "PPSSurveyForm"
    | "PPSCountryQuestionnaire"
    | "PPSHospitalForm"
    | "PPSPatientRegister"
    | "PPSWardRegister"
    | "PrevelancePlaceholder";

export type SURVEY_STATUS = "FUTURE" | "ACTIVE" | "COMPLETED";
export interface Survey extends Ref {
    name: string;
    parentPPSSurveyId?: Id;
    startDate?: Date;
    status: SURVEY_STATUS;
    assignedOrgUnit: NamedRef;
    surveyType: string;
    parentWardRegisterId?: Id;
}
