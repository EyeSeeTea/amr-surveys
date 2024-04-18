import { NamedRef, Id } from "./Ref";

export type SURVEY_FORM_TYPES =
    | "PPSSurveyForm"
    | "PPSCountryQuestionnaire"
    | "PPSHospitalForm"
    | "PPSPatientRegister"
    | "PPSWardRegister"
    | "PrevalenceSurveyForm"
    | "PrevalenceFacilityLevelForm"
    | "PrevalenceCaseReportForm"
    | "PrevalenceSampleShipTrackForm"
    | "PrevalenceCentralRefLabForm"
    | "PrevalencePathogenIsolatesLog"
    | "PrevalenceSupranationalRefLabForm";

export type SURVEY_STATUSES = "FUTURE" | "ACTIVE" | "COMPLETED";
export type SURVEY_TYPES = "SUPRANATIONAL" | "NATIONAL" | "HOSP";

export interface SurveyBase extends NamedRef {
    surveyType: string;
    astGuideline?: ASTGUIDELINE_TYPES;
}

export interface OrgUnitNamedRef extends NamedRef {
    orgUnitId: Id;
}

export type ASTGUIDELINE_TYPES = "EUCAST" | "CLSI";

export interface PrevalenceSurveyForm extends OrgUnitNamedRef {
    astGuidelines: ASTGUIDELINE_TYPES | undefined;
}

export interface Survey extends SurveyBase {
    rootSurvey: SurveyBase; // all surveys are associated with a given parent Survey Form instance.
    startDate?: Date;
    status: SURVEY_STATUSES;
    assignedOrgUnit: NamedRef;
    surveyFormType: SURVEY_FORM_TYPES;
    parentWardRegisterId?: Id;
    childCount?: number;
}
