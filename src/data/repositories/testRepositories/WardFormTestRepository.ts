import { Future } from "../../../domain/entities/generic/Future";
import { WardForm } from "../../../domain/entities/Questionnaire/WardForm";
import { WardFormRepository } from "../../../domain/repositories/WardFormRepository";
import { FutureData } from "../../api-futures";

export class WardFormTestRepository implements WardFormRepository {
    get(facilityId: string, period: string): FutureData<WardForm[]> {
        console.debug("get ward form", facilityId, period);

        return Future.success([
            {
                title: "Ward Form Example",
                columns: [
                    { id: "col1", name: "Column 1" },
                    { id: "col2", name: "Column 2" },
                ],
                rows: [
                    {
                        id: "row1",
                        name: "Row 1",
                        items: [
                            { column: { id: "col1", name: "Column 1" }, dataElement: "de1" },
                            { column: { id: "col2", name: "Column 2" }, dataElement: "de2" },
                        ],
                    },
                    {
                        id: "row2",
                        name: "Row 2",
                        items: [
                            { column: { id: "col1", name: "Column 1" }, dataElement: "de3" },
                            { column: { id: "col2", name: "Column 2" }, dataElement: "de4" },
                        ],
                    },
                ],
            },
        ]);
    }
}
