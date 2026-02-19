import { Future } from "../../../domain/entities/generic/Future";
import { WardEvent } from "../../../domain/entities/Questionnaire/WardEvent";
import { Id } from "../../../domain/entities/Ref";
import { WardEventRepository } from "../../../domain/repositories/WardEventRepository";
import { FutureData } from "../../api-futures";

export class WardEventTestRepository implements WardEventRepository {
    get(_facilityId: Id): FutureData<WardEvent[]> {
        return Future.success([
            {
                eventDate: new Date(),
                formId: "wardForm1",
                specialtyCode: "specialtyCode1",
                wardId: "W01",
            },
        ]);
    }
}
