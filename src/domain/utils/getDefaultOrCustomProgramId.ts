import { FutureData } from "../../data/api-futures";
import {
    PPS_COUNTRY_QUESTIONNAIRE_ID,
    PPS_HOSPITAL_FORM_ID,
    PPS_PATIENT_REGISTER_ID,
    PPS_SURVEY_FORM_ID,
    PPS_WARD_REGISTER_ID,
    PREVALENCE_CASE_REPORT_FORM_ID,
    PREVALENCE_CENTRAL_REF_LAB_FORM_ID,
    PREVALENCE_FACILITY_LEVEL_FORM_ID,
    PREVALENCE_MORTALITY_COHORT_ENORL_FORM,
    PREVALENCE_MORTALITY_DISCHARGE_FORM,
    PREVALENCE_MORTALITY_FOLLOWUP_FORM_D28,
    PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID,
    PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID,
    PREVALENCE_SUPRANATIONAL_REF_LAB_ID,
    PREVALENCE_SURVEY_FORM_ID,
} from "../../data/entities/D2Survey";
import { AMRSurveyModule } from "../entities/AMRSurveyModule";
import { Future } from "../entities/generic/Future";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { ModuleRepository } from "../repositories/ModuleRepository";

export function getDefaultOrCustomProgramId(
    moduleRepository: ModuleRepository,
    surveyFormType: SURVEY_FORM_TYPES,
    surveyParentId: string | undefined
): FutureData<string> {
    return moduleRepository.getAll().flatMap(modules => {
        return Future.success(getProgramId(surveyFormType, surveyParentId, modules));
    });
}

export const getProgramId = (
    surveyFormType: SURVEY_FORM_TYPES,
    surveyParentId: string | undefined,
    modules: AMRSurveyModule[]
): string => {
    const prevalenceModule = modules.find(module => module.name === "Prevalence");

    switch (surveyFormType) {
        //PPS Module
        case "PPSSurveyForm":
            return PPS_SURVEY_FORM_ID;
        case "PPSCountryQuestionnaire":
            return PPS_COUNTRY_QUESTIONNAIRE_ID;
        case "PPSHospitalForm":
            return PPS_HOSPITAL_FORM_ID;
        case "PPSPatientRegister":
            return PPS_PATIENT_REGISTER_ID;
        case "PPSWardRegister":
            return PPS_WARD_REGISTER_ID;

        //Prevalence Module
        case "PrevalenceSurveyForm":
            return PREVALENCE_SURVEY_FORM_ID;
        case "PrevalenceFacilityLevelForm":
            return PREVALENCE_FACILITY_LEVEL_FORM_ID;
        case "PrevalenceCaseReportForm":
            return getCustomOrDefaultFormId(
                surveyParentId,
                prevalenceModule,
                PREVALENCE_CASE_REPORT_FORM_ID
            );
        case "PrevalenceSampleShipTrackForm":
            return PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID;
        case "PrevalenceCentralRefLabForm":
            return PREVALENCE_CENTRAL_REF_LAB_FORM_ID;
        case "PrevalencePathogenIsolatesLog":
            return PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID;
        case "PrevalenceSupranationalRefLabForm":
            return PREVALENCE_SUPRANATIONAL_REF_LAB_ID;
        case "PrevalenceD28FollowUp":
            return PREVALENCE_MORTALITY_FOLLOWUP_FORM_D28;
        case "PrevalenceDischarge":
            return getCustomOrDefaultFormId(
                surveyParentId,
                prevalenceModule,
                PREVALENCE_MORTALITY_DISCHARGE_FORM
            );
        case "PrevalenceCohortEnrolment":
            return getCustomOrDefaultFormId(
                surveyParentId,
                prevalenceModule,
                PREVALENCE_MORTALITY_COHORT_ENORL_FORM
            );
        default:
            throw new Error("Unknown Survey Type");
    }
};

export function getCustomOrDefaultFormId(
    surveyParentId: string | undefined,
    module: AMRSurveyModule | undefined,
    defaultformId: string
): string {
    return (
        (surveyParentId ? module?.customForms?.[surveyParentId]?.[defaultformId] : undefined) ||
        defaultformId
    );
}
