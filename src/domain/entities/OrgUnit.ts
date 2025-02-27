import { NamedRef } from "./Ref";

export interface OrgUnit {
    id: string;
    shortName: string;
    path: string;
}

export interface OrgUnitBasic extends NamedRef {
    code: string;
}
