import { ASTGUIDELINE_TYPES } from "./ASTGuidelines";
import { OrgUnitBasic } from "./OrgUnit";
import { ProgramCountMap, ProgramOptionCountMap } from "./Program";
import { NamedRef, Id, Ref } from "./Ref";

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
    | "PrevalenceSupranationalRefLabForm"
    | "PrevalenceFollowUp"
    | "PrevalenceDischargeClinical"
    | "PrevalenceDischargeEconomic"
    | "PrevalenceCohortEnrolment"
    | "WardSummaryStatisticsForm";

export type SURVEY_STATUSES = "FUTURE" | "ACTIVE" | "COMPLETED";
export type SURVEY_TYPES = "SUPRANATIONAL" | "NATIONAL" | "HOSP";

export const SURVEYS_WITH_CHILD_COUNT: SURVEY_FORM_TYPES[] = [
    "PrevalenceSurveyForm",
    "PrevalenceFacilityLevelForm",
    "PrevalenceCaseReportForm",
    "PPSSurveyForm",
    "PPSCountryQuestionnaire",
    "PPSHospitalForm",
    "PPSWardRegister",
];

export const SURVEYS_WITH_ORG_UNIT_SELECTOR: readonly SURVEY_FORM_TYPES[] = [
    "PPSCountryQuestionnaire",
    "PPSHospitalForm",
    "PrevalenceSurveyForm",
    "PrevalenceFacilityLevelForm",
    "WardSummaryStatisticsForm",
];

export interface SurveyBase extends NamedRef {
    surveyType: string;
    astGuideline?: ASTGUIDELINE_TYPES;
}

export interface OrgUnitNamedRef extends NamedRef {
    orgUnitId: Id;
}

export interface OrgUnitWithCodeRef extends Ref {
    orgUnitId: Id;
    orgUnitCode: string;
}

export interface PrevalenceSurveyForm extends OrgUnitNamedRef {
    astGuidelines: ASTGUIDELINE_TYPES | undefined;
}

export type ChildCountNumber = {
    type: "number";
    value: number;
};
type ChildCountProgramOptionCountMap = {
    type: "map";
    value: ProgramOptionCountMap;
};

export type ChildCountOption = {
    type: "map";
    value: ProgramCountMap;
};
export type ChildCountLabel = ChildCountNumber | ChildCountProgramOptionCountMap;

export type ChildCount = ChildCountNumber | ChildCountOption;

export interface Survey extends SurveyBase {
    rootSurvey: SurveyBase; // all surveys are associated with a given parent Survey Form instance.
    startDate?: Date;
    status: SURVEY_STATUSES;
    assignedOrgUnit: OrgUnitBasic;
    surveyFormType: SURVEY_FORM_TYPES;
    parentWardRegisterId?: Id;
    uniquePatient?: { id: string; code: string };
    childCount?: ChildCountLabel;
    facilityCode?: string;
}
