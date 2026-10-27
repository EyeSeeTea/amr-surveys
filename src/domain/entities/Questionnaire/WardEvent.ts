import { Id } from "../Ref";

export type WardEventDetails = {
    formId: Id;
    specialtyCode?: string;
    wardId: string;
};

// Ward events whose Unique ward ID prevents a correct form from being shown
export type WardIdIssues = {
    unmatchedWardIds: string[];
    duplicatedWardIds: string[];
    missingWardIdCount: number;
};

export type WardEvent = {
    rootSurveyId: Id;
    rootSurveyName: string;
    startDate: Date;
    events: WardEventDetails[];
    wardIdIssues: WardIdIssues;
};
