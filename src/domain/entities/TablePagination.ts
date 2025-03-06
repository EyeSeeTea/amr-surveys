import { Id } from "./Ref";

export const PAGE_SIZE = 5;

export type SortDirection = "asc" | "desc";

export type SortableColumnName =
    | "surveyName"
    | "startDate"
    | "status"
    | "surveyType"
    | "wardCode"
    | "hospitalCode"
    | "uniquePatientId"
    | "uniquePatientCode";

export type SortOrder = {
    direction: SortDirection;
    id: Id; //attribute id
};

export type SortColumnDetails = {
    column: SortableColumnName;
    direction: SortDirection;
};

export interface PaginatedReponse<T> {
    pager: Pager;
    objects: T;
}

export interface Pager {
    page: number;
    total?: number;
    pageSize: number;
    pageCount?: number;
}
