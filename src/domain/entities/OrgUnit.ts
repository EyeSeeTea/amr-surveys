import { NamedRef } from "./Ref";
import { OrgUnitAccess } from "./User";

export interface OrgUnit {
    id: string;
    shortName: string;
    path: string;
}

export interface OrgUnitBasic extends NamedRef {
    code: string;
}

export function getOrgUnitByLevel(orgUnit: OrgUnitAccess, level: number): OrgUnitAccess {
    const pathSegments = orgUnit.orgUnitPath.split("/");

    if (level < 0 || level >= pathSegments.length) throw new Error("Invalid level");
    const id = pathSegments[level] ?? "";

    return { ...orgUnit, orgUnitId: id };
}
