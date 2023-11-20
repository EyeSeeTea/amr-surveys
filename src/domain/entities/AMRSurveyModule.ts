import { NamedRef } from "./Ref";

export type SURVEY_TYPE = "NationalSurvey" | "HospitalSurvey" | "SupranationalSurvey";
export interface SurveyProgram extends NamedRef {
    type: SURVEY_TYPE;
}
type UserGroups = { captureAccess: NamedRef[]; readAccess: NamedRef[]; adminAccess: NamedRef[] };

export interface AMRSurveyModule {
    id: string;
    name: string;
    color: string;
    surveyPrograms: SurveyProgram[];
    userGroups: UserGroups;
}
