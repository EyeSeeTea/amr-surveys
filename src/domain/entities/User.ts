import { Struct } from "./generic/Struct";
import { Id, NamedRef } from "./Ref";

export interface OrgUnitAccess {
    orgUnitId: Id;
    orgUnitName: string;
    orgUnitShortName: string;
    orgUnitCode: string;
    orgUnitPath: string;
    readAccess: boolean;
    captureAccess: boolean;
}
export interface UserGroup {
    id: Id;
    name: string;
}
export interface ModuleAccess {
    moduleId: Id;
    moduleName: string;
    readAccess: boolean;
    captureAccess: boolean;
    usergroups: UserGroup[];
}

export interface UserAttrs {
    id: string;
    name: string;
    username: string;
    userRoles: UserRole[];
    userGroups: NamedRef[];
    userOrgUnitsAccess: OrgUnitAccess[];
    email: string;
    phoneNumber: string;
    introduction: string;
    birthday: string;
    nationality: string;
    employer: string;
    jobTitle: string;
    education: string;
    interests: string;
    languages: string;
}

export interface UserRole extends NamedRef {
    authorities: string[];
}

export class User extends Struct<UserAttrs>() {
    belongToUserGroup(userGroupUid: string): boolean {
        return this.userGroups.some(({ id }) => id === userGroupUid);
    }

    isAdmin(): boolean {
        return this.userRoles.some(({ authorities }) => authorities.includes("ALL"));
    }
}
