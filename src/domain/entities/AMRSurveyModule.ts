import { Id, NamedRef } from "./Ref";

export type SURVEY_TYPE = "NationalSurvey" | "HospitalSurvey" | "SupranationalSurvey";

type UserGroups = { captureAccess: NamedRef[]; readAccess: NamedRef[]; adminAccess: NamedRef[] };

type SurveyRuleType = "HIDEFIELD" | "HIDESECTION" | "HIDESTAGE";

type Rule = {
    id: Id;
    type: SurveyRuleType;
    toHide: Id[]; //DataElementIds or SectionIds
};

export type SurveyRule = {
    formId: Id;
    rules: Rule[];
};

export type CustomForms = Record<string, CustomForm>;
export type CustomForm = Record<string, string>;

export interface AMRSurveyModule {
    id: string;
    name: "PPS" | "Prevalence";
    color: string;
    surveyPrograms: NamedRef[];
    userGroups: UserGroups;
    rulesBySurvey: { surveyId: Id; surveyRules: SurveyRule[]; antibioticBlacklist: string[] }[];
    customForms?: CustomForms;
}
