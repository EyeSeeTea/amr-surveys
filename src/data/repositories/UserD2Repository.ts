import { Future } from "../../domain/entities/generic/Future";
import { OrgUnitAccess, User } from "../../domain/entities/User";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { D2Api, MetadataPick } from "../../types/d2-api";
import { apiToFuture, FutureData } from "../api-futures";
import _ from "../../domain/entities/generic/Collection";
import { OrgUnit } from "../../domain/entities/OrgUnit";
import { NamedRef } from "../../domain/entities/Ref";

const NA_OU_ID = "zXAaAXzwt4M";
export const COUNTRY_OU_LEVEL = 3;
export const HOSPITAL_OU_LEVEL = 7;
export class UserD2Repository implements UserRepository {
    constructor(private api: D2Api) {}

    public getCurrent(): FutureData<User> {
        return apiToFuture(
            this.api.currentUser.get({
                fields: userFields,
            })
        ).flatMap(d2User => {
            const res = this.buildUser(d2User);
            return res;
        });
    }

    public getCurrentOUByLevel(
        organisationUnits: NamedRef[],
        dataViewOrganisationUnits: NamedRef[]
    ): FutureData<OrgUnitAccess[]> {
        const hospital$ = this.getAllOrgUnitsByLevel(
            organisationUnits,
            dataViewOrganisationUnits,
            HOSPITAL_OU_LEVEL
        );

        return hospital$.flatMap(hospitals => {
            const currentAccessibleHospitals = this.mapUserOrgUnitsAccess(
                hospitals.userOrgUnits,
                hospitals.userDataViewOrgUnits
            );

            return Future.success(currentAccessibleHospitals);
        });
    }

    public savePassword(password: string): FutureData<string> {
        return apiToFuture(
            this.api.currentUser.get({
                fields: {
                    $all: true,
                    userCredentials: {
                        $owner: true,
                    },
                },
            })
        ).flatMap(currentUser => {
            currentUser.userCredentials.password = password;

            return apiToFuture(this.api.metadata.post({ users: [currentUser] })).flatMap(res => {
                if (res.status === "OK") return Future.success(res.status);
                else {
                    const error = new Error(res.status);
                    return Future.error(error);
                }
            });
        });
    }

    private buildUser(d2User: D2User): FutureData<User> {
        const { organisationUnits, dataViewOrganisationUnits } = d2User;

        const countries$ = this.getAllOrgUnitsByLevel(
            organisationUnits,
            dataViewOrganisationUnits,
            COUNTRY_OU_LEVEL
        );
        return countries$.flatMap(countries => {
            return apiToFuture(this.api.get<D2UserSettings>(`userSettings`)).flatMap(
                userSettings => {
                    const user = new User({
                        id: d2User.id,
                        name: d2User.displayName,
                        userGroups: d2User.userGroups,
                        ...d2User.userCredentials,
                        email: d2User.email,
                        phoneNumber: d2User.phoneNumber,
                        introduction: d2User.introduction,
                        birthday: d2User.birthday,
                        nationality: d2User.nationality,
                        employer: d2User.employer,
                        jobTitle: d2User.jobTitle,
                        education: d2User.education,
                        interests: d2User.interests,
                        languages: d2User.languages,
                        userCountriesAccess: this.mapUserOrgUnitsAccess(
                            countries.userOrgUnits,
                            countries.userDataViewOrgUnits
                        ),

                        settings: {
                            keyUiLocale: userSettings.keyUiLocale,
                            keyDbLocale: userSettings.keyDbLocale,
                            keyMessageEmailNotification: userSettings.keyMessageEmailNotification,
                            keyMessageSmsNotification: userSettings.keyMessageSmsNotification,
                        },
                        organisationUnits,
                        dataViewOrganisationUnits,
                    });
                    return Future.success(user);
                }
            );
        });
    }

    getAllOrgUnitsByLevel = (
        organisationUnits: NamedRef[],
        dataViewOrganisationUnits: NamedRef[],
        level: number
    ): FutureData<{ userOrgUnits: OrgUnit[]; userDataViewOrgUnits: OrgUnit[] }> => {
        //1. Get all OUs
        return apiToFuture(
            this.api.models.organisationUnits.get({
                filter: {
                    level: { eq: level.toString() },
                },
                fields: {
                    id: true,
                    shortName: true,
                    path: true,
                    level: true,
                },
                paging: false,
            })
        ).flatMap(res => {
            const allLevelOUs: OrgUnit[] = _(
                res.objects.map(ou => {
                    if (!ou.path.includes(NA_OU_ID))
                        return {
                            id: ou.id,
                            shortName: ou.shortName,

                            path: ou.path,
                        };
                })
            )
                .compact()
                .value();

            //2. Filter OUs which the user has access to.
            //If the user has access to any parent of the OU, then they have access to the OU.
            //So, check the path to see if it contains any OU  user has access to.
            const userOrgUnits = allLevelOUs.filter(levelOU =>
                organisationUnits.some(userOU => levelOU.path.includes(userOU.id))
            );
            const userDataViewOrgUnits = allLevelOUs.filter(levelOU =>
                dataViewOrganisationUnits.some(userOU => levelOU.path.includes(userOU.id))
            );

            return Future.success({ userOrgUnits, userDataViewOrgUnits });
        });
    };

    mapUserOrgUnitsAccess = (
        organisationUnits: OrgUnit[],
        dataViewOrganisationUnits: OrgUnit[]
    ): OrgUnitAccess[] => {
        const orgUnitsAccess: OrgUnitAccess[] = organisationUnits.map(ou => ({
            orgUnitId: ou.id,
            orgUnitShortName: ou.shortName,
            orgUnitPath: ou.path,
            readAccess: dataViewOrganisationUnits.includes(ou),
            captureAccess: true,
        }));

        //Setting view access for org units that are present in dataViewOrganisationUnits and not organisationUnits
        const readOnlyAccessOrgUnits: OrgUnitAccess[] = dataViewOrganisationUnits
            .filter(dvou => !organisationUnits.includes(dvou))
            .map(raou => ({
                orgUnitId: raou.id,
                orgUnitShortName: raou.shortName,
                orgUnitPath: raou.path,
                readAccess: true,
                captureAccess: false, //orgUnits in dataViewOrganisationUnits dont have capture access
            }));
        const newOrgUnitsAccess: OrgUnitAccess[] = [...orgUnitsAccess, ...readOnlyAccessOrgUnits];
        return newOrgUnitsAccess;
    };

    saveLocale(isUiLocale: boolean, locale: string): FutureData<void> {
        return apiToFuture(
            this.api.post<{ status: "OK" | "SUCCESS" | "WARNING" | "ERROR" }>(
                `/userSettings/${isUiLocale ? "keyUiLocale" : "keyDbLocale"}`,
                { value: locale },
                {}
            )
        ).flatMap(res => {
            if (res.status === "OK") {
                return Future.success(undefined);
            } else {
                const error = new Error(res.status);
                return Future.error(error);
            }
        });
    }
}

const userFields = {
    id: true,
    displayName: true,
    userGroups: { id: true, name: true },
    userCredentials: {
        username: true,
        userRoles: { id: true, name: true, authorities: true },
    },
    email: true,
    phoneNumber: true,
    introduction: true,
    birthday: true,
    nationality: true,
    employer: true,
    jobTitle: true,
    education: true,
    interests: true,
    languages: true,
    organisationUnits: {
        id: true,
        name: true,
    },
    dataViewOrganisationUnits: {
        id: true,
        name: true,
    },
} as const;

type D2User = MetadataPick<{ users: { fields: typeof userFields } }>["users"][number];
type D2UserSettings = {
    keyUiLocale: string;
    keyDbLocale: string;
    keyMessageEmailNotification: boolean;
    keyMessageSmsNotification: boolean;
};
