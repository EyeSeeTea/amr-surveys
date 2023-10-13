import { NamedRef } from "./Ref";

type SurveyProgram = NamedRef;
type UserGroups = NamedRef;

export interface AMRSurveyModule {
    id: string;
    name: string;
    color: string;
    surveyPrograms: SurveyProgram[];
    usergroups: UserGroups[];
}
