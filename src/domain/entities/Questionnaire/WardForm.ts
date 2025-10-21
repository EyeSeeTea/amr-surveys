import { NamedRef } from "../Ref";

type Column = NamedRef;

type RowItem = {
    column: Column;
    dataElement: string;
};

type Row = {
    id: string;
    name: string;
    items: RowItem[];
};

export type WardForm = {
    title: string;
    columns: Column[];
    rows: Row[];
};
