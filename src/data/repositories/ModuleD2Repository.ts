import { D2Api, Id } from "@eyeseetea/d2-api/2.36";
import { AMRSurveyModule } from "../../domain/entities/AMRSurveyModule";
import { Future } from "../../domain/entities/generic/Future";
import { ModuleRepository } from "../../domain/repositories/ModuleRepository";
import { apiToFuture, FutureData } from "../api-futures";
import { DataStoreClient } from "../DataStoreClient";
import { DataStoreKeys } from "../DataStoreKeys";

export class ModuleD2Repository implements ModuleRepository {
    constructor(private dataStoreClient: DataStoreClient, private api: D2Api) {}
    getAll(): FutureData<AMRSurveyModule[]> {
        return this.dataStoreClient.listCollection<AMRSurveyModule>(DataStoreKeys.MODULES);
    }

    getProgramsEnrolledInOrgUnit(orgUnitId: Id): FutureData<Id[]> {
        return apiToFuture(
            this.api.models.organisationUnits.get({
                fields: {
                    programs: { id: true },
                },
                filter: {
                    id: { eq: orgUnitId },
                },
                paging: false,
            })
        ).flatMap(res => {
            //There will be only one orgUnit as eq filter is applied.
            if (res.objects[0]) {
                const programs: Id[] = res.objects[0].programs.map(p => {
                    return p.id;
                });
                return Future.success(programs);
            } else {
                const error = new Error("Program corresponding to OU not found");
                return Future.error(error);
            }
        });
    }
}
