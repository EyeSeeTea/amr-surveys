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
