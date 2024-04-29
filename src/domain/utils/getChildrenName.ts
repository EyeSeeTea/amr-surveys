import i18n from "../../utils/i18n";
import { SURVEY_FORM_TYPES } from "../entities/Survey";

export const getChildrenName = (surveyFormType: SURVEY_FORM_TYPES): string => {
    switch (surveyFormType) {
        case "PrevalenceSurveyForm":
            return i18n.t("Facilities");
        case "PrevalenceFacilityLevelForm":
            return i18n.t("Patients");
        default:
            throw new Error("Invalid survey form type");
    }
};
