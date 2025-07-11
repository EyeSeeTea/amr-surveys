import i18n from "../../utils/i18n";
import { SURVEY_FORM_TYPES } from "../entities/Survey";

export const getChildrenName = (surveyFormType: SURVEY_FORM_TYPES): string[] => {
    switch (surveyFormType) {
        case "PrevalenceSurveyForm":
            return [i18n.t("Facilities")];
        case "PrevalenceCaseReportForm":
            return [
                i18n.t("Sample Shipment"),
                i18n.t("Central Ref Lab Results"),
                i18n.t("Pathogen Isolates Logs"),
                i18n.t("Supranational Ref Results"),
                i18n.t("D28 Follow-up"),
                i18n.t("Discharge - Clinical"),
                i18n.t("Discharge - Economic"),
                i18n.t("Cohort enrolment"),
            ];
        case "PPSSurveyForm":
            return [i18n.t("Countries")];
        case "PPSCountryQuestionnaire":
            return [i18n.t("Hospitals")];
        case "PPSHospitalForm":
            return [i18n.t("Wards")];
        case "PrevalenceFacilityLevelForm":
        case "PPSWardRegister":
            return [i18n.t("Patients")];
        default:
            throw new Error("Invalid survey form type");
    }
};
