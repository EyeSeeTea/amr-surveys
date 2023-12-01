import { NamedRef } from "./Ref";

export type SURVEY_TYPE = "NationalSurvey" | "HospitalSurvey" | "SupranationalSurvey";

type UserGroups = { captureAccess: NamedRef[]; readAccess: NamedRef[]; adminAccess: NamedRef[] };

export interface AMRSurveyModule {
    id: string;
    name: string;
    color: string;
    surveyPrograms: NamedRef[];
    userGroups: UserGroups;
}
