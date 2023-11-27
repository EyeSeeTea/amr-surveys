import { NamedRef, Id } from "./Ref";

export type SURVEY_FORM_TYPES =
    | "PPSSurveyForm"
    | "PPSCountryQuestionnaire"
    | "PPSHospitalForm"
    | "PPSPatientRegister"
    | "PPSWardRegister"
    | "PrevelancePlaceholder";

export type SURVEY_STATUS = "FUTURE" | "ACTIVE" | "COMPLETED";

export interface Survey extends NamedRef {
    rootSurvey: {
        id: Id;
        name: string;
        surveyType: string;
    }; //For PPS module, all surveys are associated with a given PPS Survey Form instance.
    startDate?: Date;
    status: SURVEY_STATUS;
    assignedOrgUnit: NamedRef;
    surveyType: string;
    surveyFormType: SURVEY_FORM_TYPES;
    parentWardRegisterId?: Id;
}
