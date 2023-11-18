import { Future } from "../../domain/entities/generic/Future";
import { OrgUnitAccess, User } from "../../domain/entities/User";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { D2Api, MetadataPick } from "../../types/d2-api";
import { apiToFuture, FutureData } from "../api-futures";
import _ from "../../domain/entities/generic/Collection";
import { OrgUnit } from "../../domain/entities/OrgUnit";

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

        const filteredOUs = organisationUnits.filter(
            ou => ou.code !== "NA" && ou.parent?.code !== "NA"
        );
        const filteredDataViewOUs = dataViewOrganisationUnits.filter(
            ou => ou.code !== "NA" && ou.parent?.code !== "NA"
        );

        const countryOUs: OrgUnit[] = [];
        const dataViewCountryOUs: OrgUnit[] = [];

        const hospitalOUs: OrgUnit[] = [];
        const dataViewHospitalOUs: OrgUnit[] = [];

        //TO DO : Fetch country level from datastore.
        const countryLevel = 3;
        const hospitalLevel = 4;

        filteredOUs.forEach(orgUnit => {
            if (orgUnit?.parent?.code !== "NA") {
                if (orgUnit.level === countryLevel)
                    countryOUs.push({
                        name: orgUnit.name,
                        id: orgUnit.id,
                        shortName: orgUnit.shortName,
                        code: orgUnit.code,
                        path: orgUnit.path,
                    });
                else if (orgUnit.level === hospitalLevel) {
                    hospitalOUs.push({
                        name: orgUnit.name,
                        id: orgUnit.id,
                        shortName: orgUnit.shortName,
                        code: orgUnit.code,
                        path: orgUnit.path,
                    });
                }
            }
        });

        filteredDataViewOUs.forEach(dataViewOrgUnit => {
            if (dataViewOrgUnit?.parent?.code !== "NA") {
                if (dataViewOrgUnit.level === countryLevel)
                    dataViewCountryOUs.push({
                        name: dataViewOrgUnit.name,
                        id: dataViewOrgUnit.id,
                        shortName: dataViewOrgUnit.shortName,
                        code: dataViewOrgUnit.code,
                        path: dataViewOrgUnit.path,
                    });
                else if (dataViewOrgUnit.level === hospitalLevel)
                    dataViewHospitalOUs.push({
                        name: dataViewOrgUnit.name,
                        id: dataViewOrgUnit.id,
                        shortName: dataViewOrgUnit.shortName,
                        code: dataViewOrgUnit.code,
                        path: dataViewOrgUnit.path,
                    });
            }
        });

        return this.getAllLevelOrgUnits(filteredOUs, countryLevel).flatMap(countries => {
            return this.getAllLevelOrgUnits(filteredDataViewOUs, countryLevel).flatMap(
                dataViewCountries => {
                    return this.getAllLevelOrgUnits(filteredOUs, hospitalLevel).flatMap(
                        hospitals => {
                            return this.getAllLevelOrgUnits(
                                filteredDataViewOUs,
                                hospitalLevel
                            ).flatMap(dataViewHospitals => {
                                return apiToFuture(
                                    this.api.get<D2UserSettings>(`userSettings`)
                                ).flatMap(userSettings => {
                                    const uniqueCountries = _([...countryOUs, ...countries])
                                        .uniq()
                                        .value();

                                    const uniqueDataViewCountries = _([
                                        ...dataViewCountryOUs,
                                        ...dataViewCountries,
                                    ])
                                        .uniq()
                                        .value();

                                    const uniqueHospitals = _([...hospitalOUs, ...hospitals])
                                        .uniq()
                                        .value();

                                    const uniqueDataViewHospitals = _([
                                        ...dataViewHospitalOUs,
                                        ...dataViewHospitals,
                                    ])
                                        .uniq()
                                        .value();

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
                                            uniqueCountries,
                                            uniqueDataViewCountries
                                        ),
                                        userHospitalsAccess: this.mapUserOrgUnitsAccess(
                                            uniqueHospitals,
                                            uniqueDataViewHospitals
                                        ),
                                        settings: {
                                            keyUiLocale: userSettings.keyUiLocale,
                                            keyDbLocale: userSettings.keyDbLocale,
                                            keyMessageEmailNotification:
                                                userSettings.keyMessageEmailNotification,
                                            keyMessageSmsNotification:
                                                userSettings.keyMessageSmsNotification,
                                        },
                                    });

                                    return Future.success(user);
                                });
                            });
                        }
                    );
                }
            );
        });
    }

    mapUserOrgUnitsAccess = (
        organisationUnits: OrgUnit[],
        dataViewOrganisationUnits: OrgUnit[]
    ): OrgUnitAccess[] => {
        let orgUnitsAccess = organisationUnits.map(ou => ({
            orgUnitId: ou.id,
            orgUnitName: ou.name,
            orgUnitShortName: ou.shortName,
            orgUnitCode: ou.code,
            orgUnitPath: ou.path,
            readAccess: dataViewOrganisationUnits.some(dvou => dvou.id === ou.id),
            captureAccess: true,
        }));

        //Setting view access for org units that are present in dataViewOrganisationUnits and not organisationUnits
        const readOnlyAccessOrgUnits = dataViewOrganisationUnits
            .filter(dvou => orgUnitsAccess.every(oua => oua.orgUnitId !== dvou.id))
            .map(raou => ({
                orgUnitId: raou.id,
                orgUnitName: raou.name,
                orgUnitShortName: raou.shortName,
                orgUnitCode: raou.code,
                orgUnitPath: raou.path,
                readAccess: true,
                captureAccess: false, //orgUnits in dataViewOrganisationUnits dont have capture access
            }));

        orgUnitsAccess = [...orgUnitsAccess, ...readOnlyAccessOrgUnits].sort((a, b) =>
            a.orgUnitShortName.localeCompare(b.orgUnitShortName)
        );

        return orgUnitsAccess;
    };

    private getAllLevelOrgUnits(orgUnits: OrgUnit[], countryLevel: number): FutureData<OrgUnit[]> {
        const result: OrgUnit[] = [];

        const recursiveGetOrgUnits = (
            filteredOUs: OrgUnit[],
            countryLevel: number
        ): FutureData<OrgUnit[]> => {
            const childrenOrgUnits = apiToFuture(
                this.api.models.organisationUnits.get({
                    filter: {
                        level: { le: countryLevel.toString() },
                    },
                    fields: {
                        id: true,
                        name: true,
                        shortName: true,
                        code: true,
                        path: true,
                        level: true,
                        parent: {
                            id: true,
                        },
                    },
                    paging: false,
                })
            ).map(res => {
                const filteredIds = filteredOUs.map(ou => ou.id);
                const childOrgUnits = res.objects.filter(ou => filteredIds.includes(ou.parent?.id));
                return childOrgUnits;
            });

            return childrenOrgUnits.flatMap(childrenOrgUnits => {
                if (childrenOrgUnits[0] && childrenOrgUnits[0]?.level < countryLevel) {
                    return this.getAllLevelOrgUnits(
                        childrenOrgUnits.map(el => {
                            return {
                                name: el.name,
                                id: el.id,
                                shortName: el.shortName,
                                code: el.code,
                                path: el.path,
                            };
                        }),
                        countryLevel
                    );
                } else {
                    childrenOrgUnits.forEach(el => {
                        result.push({
                            name: el.name,
                            id: el.id,
                            shortName: el.shortName,
                            code: el.code,
                            path: el.path,
                        });
                    });
                    return Future.success(result);
                }
            });
        };

        const filteredOrgUnits = orgUnits.filter(ou => ou.code !== "NA");
        return recursiveGetOrgUnits(filteredOrgUnits, countryLevel).flatMap(orgUnits => {
            return Future.success(orgUnits);
        });
    }

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
        shortName: true,
        code: true,
        path: true,
        children: true,
        level: true,
        parent: {
            id: true,
            code: true,
        },
    },
    dataViewOrganisationUnits: {
        id: true,
        name: true,
        shortName: true,
        code: true,
        level: true,
        path: true,
        parent: {
            id: true,
            code: true,
        },
    },
} as const;

type D2User = MetadataPick<{ users: { fields: typeof userFields } }>["users"][number];
type D2UserSettings = {
    keyUiLocale: string;
    keyDbLocale: string;
    keyMessageEmailNotification: boolean;
    keyMessageSmsNotification: boolean;
};
