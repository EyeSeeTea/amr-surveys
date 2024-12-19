import _ from "../../domain/entities/generic/Collection";
import { getValidationErrorsByItem } from "../../utils/validations";
import { ProgramDataElement, ProgramDataElementModel } from "../entities/D2Program";
import i18n from "../../utils/i18n";

export function validateDataElements(dataElements: ProgramDataElement[]): string | null {
    const dataElementErrors = getValidationErrorsByItem(ProgramDataElementModel, dataElements);
    if (dataElementErrors) {
        const dataElementErrorIdentifiers = _(dataElementErrors)
            .map(de => de.item.code)
            .uniq()
            .join(", ");
        console.error("DataElement validation errors", dataElementErrors);
        return i18n.t("There was a problem with {{dataElementErrorIdentifiers}}", {
            dataElementErrorIdentifiers,
        });
    } else {
        return null;
    }
}
