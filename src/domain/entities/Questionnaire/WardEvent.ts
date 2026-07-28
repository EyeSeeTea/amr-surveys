import { Id } from "../Ref";

export type WardEventDetails = {
    formId: Id;
    specialtyCode?: string;
    wardId: string;
};

export type WardEvent = {
    rootSurveyId: Id;
    rootSurveyName: string;
    startDate: Date;
    events: WardEventDetails[];
    unmatchedWardIds: string[];
};
