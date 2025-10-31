import { Maybe } from "../../../utils/ts-utils";
import { Id, NamedRef } from "../Ref";

type Column = NamedRef;

export type FormValue = {
    columnId: Id;
    formId: Id;
    rowId: Id;
    value: Maybe<string>;
};

export type Row = NamedRef & {
    rowItems: FormValue[];
};

export type WardForm = {
    columns: Column[];
    formId: Id;
    rows: Row[];
    title: string;
};
