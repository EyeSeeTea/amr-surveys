import { Id } from "../Ref";

export type WardEvent = {
    eventDate: Date;
    formId: Id;
    specialtyCode: string;
    wardId: string;
};
