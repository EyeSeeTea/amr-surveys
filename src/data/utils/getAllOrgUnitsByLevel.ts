import { OrgUnit } from "../../domain/entities/OrgUnit";
import { Future } from "../../domain/entities/generic/Future";
import { D2Api } from "../../types/d2-api";
import { FutureData, apiToFuture } from "../api-futures";
import { NA_OU_ID } from "../repositories/UserD2Repository";
import _ from "../../domain/entities/generic/Collection";

export const getAllOrgUnitsByLevel = (api: D2Api): FutureData<OrgUnit[]> => {
    //1. Get all OUs
    return apiToFuture(
        api.models.organisationUnits.get({
            filter: {
                level: { eq: "7" },
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
    ).flatMap(res => {
        const allLevelOUs: OrgUnit[] = _(
            res.objects.map(ou => {
                if (!ou.path.includes(NA_OU_ID))
                    return {
                        name: ou.name,
                        id: ou.id,
                        shortName: ou.shortName,
                        code: ou.code,
                        path: ou.path,
                    };
            })
        )
            .compact()
            .value();

        return Future.success(allLevelOUs);
    });
};
