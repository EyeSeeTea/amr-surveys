import { Future } from "../../../domain/entities/generic/Future";
import { WardEvent } from "../../../domain/entities/Questionnaire/WardEvent";
import { OrgUnitAccess } from "../../../domain/entities/User";
import { WardEventRepository } from "../../../domain/repositories/WardEventRepository";
import { FutureData } from "../../api-futures";

export class WardEventTestRepository implements WardEventRepository {
    get(_facility: OrgUnitAccess): FutureData<WardEvent[]> {
        return Future.success([
            {
                rootSurveyId: "survey1",
                rootSurveyName: "Ward Survey",
                startDate: new Date(),
                events: [
                    {
                        formId: "wardForm1",
                        specialtyCode: "specialtyCode1",
                        wardId: "W01",
                    },
                ],
            },
        ]);
    }
}
