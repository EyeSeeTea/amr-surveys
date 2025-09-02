import { PREVALENCE_MORTALITY_DISCHARGE_ECONOMIC_FORM } from "../../data/entities/D2Survey";
import i18n from "../../utils/i18n";
import { SURVEY_FORM_TYPES } from "../entities/Survey";

export const getChildrenName = (
    surveyFormType: SURVEY_FORM_TYPES,
    disabledForms?: string[]
): string[] => {
    switch (surveyFormType) {
        case "PrevalenceSurveyForm":
            return [i18n.t("Facilities")];
        case "PrevalenceCaseReportForm": {
            const prevalenceCaseReportChildrenNames = [
                i18n.t("Sample Shipment"),
                i18n.t("Central Ref Lab Results"),
                i18n.t("Pathogen Isolates Logs"),
                i18n.t("Supranational Ref Results"),
                i18n.t("Follow-up"),
                i18n.t("Discharge - Clinical"),
                i18n.t("Discharge - Economic"),
                i18n.t("Cohort enrolment"),
            ];

            if (disabledForms?.includes(PREVALENCE_MORTALITY_DISCHARGE_ECONOMIC_FORM)) {
                return prevalenceCaseReportChildrenNames.filter(
                    column => column !== i18n.t("Discharge - Economic")
                );
            }

            return prevalenceCaseReportChildrenNames;
        }
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
