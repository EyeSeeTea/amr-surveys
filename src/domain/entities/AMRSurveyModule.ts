import { Id, NamedRef } from "./Ref";

export type SURVEY_TYPE = "NationalSurvey" | "HospitalSurvey" | "SupranationalSurvey";

type UserGroups = { captureAccess: NamedRef[]; readAccess: NamedRef[]; adminAccess: NamedRef[] };

type SurveyRuleType = "HIDEFIELD" | "HIDESECTION";

type Rule = {
    id: Id;
    type: SurveyRuleType;
    toHide: Id[]; //DataElementIds or SectionIds
};

export type SurveyRule = {
    formId: Id;
    rules: Rule[];
};

export interface AMRSurveyModule {
    id: string;
    name: string;
    color: string;
    surveyPrograms: NamedRef[];
    userGroups: UserGroups;
    rulesBySurvey: { surveyId: Id; surveyRules: SurveyRule[]; antibioticBlacklist: string[] }[];
}
