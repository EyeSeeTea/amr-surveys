import { Future } from "../../../domain/entities/generic/Future";
import { FormValue, WardForm } from "../../../domain/entities/Questionnaire/WardForm";
import { Id } from "../../../domain/entities/Ref";
import { WardFormRepository } from "../../../domain/repositories/WardFormRepository";
import { FutureData } from "../../api-futures";

export class WardFormTestRepository implements WardFormRepository {
    get(facilityId: string, period: string): FutureData<WardForm[]> {
        console.debug("get ward form", facilityId, period);

        const wardForm: WardForm[] = [
            {
                formId: "wardForm1",
                title: "Ward Form Example",
                columns: [
                    { id: "col1", name: "Column 1" },
                    { id: "col2", name: "Column 2" },
                ],
                rows: [
                    {
                        id: "row1",
                        name: "Row 1",
                        rowItems: [
                            {
                                rowId: "de1",
                                columnId: "coc1",
                                formId: "aoc1",
                                value: "10",
                            },
                            {
                                rowId: "de2",
                                columnId: "coc2",
                                formId: "aoc2",
                                value: "5",
                            },
                        ],
                    },
                    {
                        id: "row2",
                        name: "Row 2",
                        rowItems: [
                            {
                                rowId: "de3",
                                columnId: "coc3",
                                formId: "aoc3",
                                value: undefined,
                            },
                            {
                                rowId: "de4",
                                columnId: "coc4",
                                formId: "aoc4",
                                value: "20",
                            },
                        ],
                    },
                ],
            },
        ];

        return Future.success(wardForm);
    }

    save(formValue: FormValue, facilityId: Id, period: string): FutureData<void> {
        console.debug("save ward form", formValue, facilityId, period);
        return Future.success(undefined);
    }
}
