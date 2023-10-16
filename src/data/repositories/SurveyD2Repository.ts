import { D2Api, Id } from "@eyeseetea/d2-api/2.36";
import { Future } from "../../domain/entities/generic/Future";
import { Survey, SURVEY_STATUS } from "../../domain/entities/Survey";
import { SurveyRepository } from "../../domain/repositories/SurveyRepository";
import { apiToFuture, FutureData } from "../api-futures";

export class SurveyD2Repository implements SurveyRepository {
    constructor(private api: D2Api) {}

    //TO DO : Code in progress, event creation failing at DHIS
    getAll(program: Id, orgUnitId: Id): FutureData<Survey[]> {
        return apiToFuture(
            this.api.tracker.events.get({
                fields: {
                    event: true,
                    scheduledAt: true,
                    status: true,
                },

                filter: `programId:eq:${program}&orgUnit:eq:${orgUnitId}`,
            })
        ).flatMap(res => {
            const surveys: Survey[] = res.instances.map(e => {
                return {
                    id: e.event,
                    name: "",
                    startDate: e.scheduledAt ? new Date(e.scheduledAt) : new Date(),
                    status: e.status as SURVEY_STATUS,
                    assignedOrgUnits: [
                        {
                            id: e.orgUnit,
                            name: e.orgUnitName ?? "",
                        },
                    ],
                };
            });
            return Future.success(surveys);
        });
    }
}
