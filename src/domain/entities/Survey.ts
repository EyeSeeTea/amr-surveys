import { AMRSurveyModule } from "./AMRSurveyModule";
import { NamedRef } from "./Ref";

export type SURVEY_STATUS = "FUTURE" | "ACTIVE" | "COMPLETED";
export interface Survey extends NamedRef {
    startDate: Date;
    status: SURVEY_STATUS;
    assignedOrgUnits: NamedRef[];
    module?: AMRSurveyModule;
}
