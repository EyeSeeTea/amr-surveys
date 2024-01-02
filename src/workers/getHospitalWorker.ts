import { D2Api } from "@eyeseetea/d2-api/2.36";
import { OrgUnit } from "../domain/entities/OrgUnit";
import { NamedRef } from "../domain/entities/Ref";
import { OrgUnitAccess } from "../domain/entities/User";

const NA_OU_ID = "zXAaAXzwt4M";
const HOSPITAL_OU_LEVEL = 7;

/* eslint-disable no-restricted-globals */
self.onmessage = (event: {
    data: {
        api: D2Api;
        userOrgUnits: NamedRef[];
        userDataViewOrgUnits: NamedRef[];
    };
}) => {
    const { api, userOrgUnits, userDataViewOrgUnits } = event.data;
    if (api) {
        fetch(
            `${api.baseUrl}/api/organisationUnits?filter=level:eq:${HOSPITAL_OU_LEVEL}&fields=id,name,shortName,code,path,level,parent&paging=false`
        )
            .then(response => {
                response
                    .json()
                    .then(res => {
                        const allLevelOUs: OrgUnit[] = res.organisationUnits
                            .filter(
                                (ou: { path: string | string[] }) => !ou.path.includes(NA_OU_ID)
                            )
                            .map(
                                (ou: {
                                    name: any;
                                    id: any;
                                    shortName: any;
                                    code: any;
                                    path: any;
                                }) => {
                                    return {
                                        name: ou.name,
                                        id: ou.id,
                                        shortName: ou.shortName,
                                        code: ou.code,
                                        path: ou.path,
                                    };
                                }
                            );

                        //2. Filter OUs which the user has access to.
                        //If the user has access to any parent of the OU, then they have access to the OU.
                        //So, check the path to see if it contains any OU  user has access to.
                        const userHospitals = allLevelOUs.filter(levelOU =>
                            userOrgUnits.some(userOU => levelOU.path.includes(userOU.id))
                        );
                        const userDataViewHospitals = allLevelOUs.filter(levelOU =>
                            userDataViewOrgUnits.some(userOU => levelOU.path.includes(userOU.id))
                        );
                        const hospitalOrgUnitAccess = mapUserOrgUnitsAccess(
                            userHospitals,
                            userDataViewHospitals
                        );
                        self.postMessage({ hospitalOrgUnitAccess });
                    })
                    .catch(jsonErr => console.debug(jsonErr));
            })
            .catch(err => {
                alert("An error occurred in hospital worker" + err);
            });
    }
};

const mapUserOrgUnitsAccess = (
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
