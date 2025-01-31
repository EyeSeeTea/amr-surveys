import { TrackedEntitiesGetResponse } from "@eyeseetea/d2-api/api/trackerTrackedEntities";
import { SURVEY_FORM_TYPES, SURVEY_STATUSES, Survey } from "../../domain/entities/Survey";
import {
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF,
    PPS_SURVEY_FORM_ID,
    PREVALENCE_SURVEY_FORM_ID,
    SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID,
    keyToDataElementMap,
    AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID,
    AMR_SURVEYS_PREVALENCE_TEA_PATIENT_ID,
    AMR_SURVEYS_PREVALENCE_TEA_AMRPATIENT_IDPREVALENCE,
    AMR_SURVEYS_PREVALENCE_TEA_PATIENT_IDA19,
    AMR_SURVEYS_MORTALITY_TEA_PAT_ID_FUP2,
    AMR_SURVEYS_MORTALITY_TEA_PAT_ID_DF2,
    AMR_SURVEYS_MORTALITY_TEA_PAT_ID_COH2,
    AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_FUP,
    AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_DF,
    AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_COH,
    AMR_SURVEYS_PREVALENCE_TEA_HOSPITAL_ID,
    SURVEY_ID_PATIENT_TEA_ID,
    SURVEY_PATIENT_ID_TEA_ID,
    WARD_ID_TEA_ID,
    SURVEY_PATIENT_CODE_TEA_ID,
} from "../entities/D2Survey";
import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { getSurveyNameBySurveyFormType } from "./surveyProgramHelper";
import { Id } from "../../domain/entities/Ref";

export const mapTrackedEntityToSurvey = (
    trackedEntities: TrackedEntitiesGetResponse,
    surveyFormType: SURVEY_FORM_TYPES
): Survey[] => {
    return trackedEntities.instances.map(trackedEntity => {
        const parentPrevalenceSurveyId =
            trackedEntity.attributes?.find(
                attribute =>
                    attribute.attribute === SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID ||
                    attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF ||
                    attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL ||
                    attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS ||
                    attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL ||
                    attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF ||
                    attribute.attribute === AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_FUP ||
                    attribute.attribute === AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_DF ||
                    attribute.attribute === AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_COH
            )?.value ?? "";

        const parentPPSSurveyId =
            trackedEntity.attributes?.find(attr => attr.attribute === SURVEY_ID_PATIENT_TEA_ID)
                ?.value ?? "";

        const patientId =
            trackedEntity.attributes?.find(
                attribute =>
                    attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID ||
                    attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_PATIENT_ID ||
                    attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_AMRPATIENT_IDPREVALENCE ||
                    attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_PATIENT_IDA19 ||
                    attribute.attribute === AMR_SURVEYS_MORTALITY_TEA_PAT_ID_FUP2 ||
                    attribute.attribute === AMR_SURVEYS_MORTALITY_TEA_PAT_ID_DF2 ||
                    attribute.attribute === AMR_SURVEYS_MORTALITY_TEA_PAT_ID_COH2 ||
                    attribute.attribute === SURVEY_PATIENT_ID_TEA_ID
            )?.value ?? "";

        const patientCode =
            trackedEntity.attributes?.find(
                attribute => attribute.attribute === SURVEY_PATIENT_CODE_TEA_ID
            )?.value ?? "";

        const facilityCode =
            trackedEntity.attributes?.find(
                attribute => attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_HOSPITAL_ID
            )?.value ?? "";

        const parentWardId =
            trackedEntity.attributes?.find(attribute => attribute.attribute === WARD_ID_TEA_ID)
                ?.value ?? "";

        const survey: Survey = {
            id: trackedEntity.trackedEntity ?? "",
            name: trackedEntity.trackedEntity ?? "",
            rootSurvey: {
                id:
                    surveyFormType === "PPSPatientRegister"
                        ? parentPPSSurveyId
                        : parentPrevalenceSurveyId,
                name: "",
                surveyType: "",
            },
            startDate: trackedEntity.createdAt ? new Date(trackedEntity.createdAt) : undefined,
            status: "ACTIVE",
            assignedOrgUnit: {
                id: trackedEntity.orgUnit ?? "",
                name: trackedEntity.enrollments?.[0]?.orgUnitName ?? "",
            },
            surveyType: "",
            parentWardRegisterId: parentWardId,
            surveyFormType: surveyFormType,
            childCount: undefined,
            uniquePatient: { id: patientId, code: patientCode },
            facilityCode: facilityCode,
        };
        return survey;
    });
};

export const mapEventToSurvey = (
    events: D2TrackerEvent[],
    surveyFormType: SURVEY_FORM_TYPES,
    programId: Id
): Survey[] => {
    return events.map((event: D2TrackerEvent) => {
        const surveyProperties = new Map(
            keyToDataElementMap.map(({ key, dataElements }) => {
                const value =
                    event.dataValues.find(dv => dataElements.includes(dv.dataElement))?.value ?? "";

                return [key, value] as const;
            })
        );

        const startDateStr = surveyProperties.get("startDate");
        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const surveyName = surveyProperties.get("surveyName") ?? "";
        const surveyCompleted = surveyProperties.get("surveyCompleted") ?? "";
        const hospitalCode = surveyProperties.get("hospitalCode") ?? "";
        const wardCode = surveyProperties.get("wardCode") ?? "";
        const patientId = surveyProperties.get("patientId") ?? "";
        const patientCode = surveyProperties.get("patientCode") ?? "";
        const parentPPSSurveyId = surveyProperties.get("parentPPSSurveyId") ?? "";
        const surveyType = surveyProperties.get("surveyType") ?? "";
        const parentWardRegisterId = surveyProperties.get("parentWardRegisterId") ?? "";
        const astGuideline = surveyProperties.get("astGuideline") ?? "";
        const customAstGuideline = surveyProperties.get("customAstGuideline") ?? "";

        const status =
            surveyCompleted === "false" && startDate
                ? startDate > new Date()
                    ? "FUTURE"
                    : "ACTIVE"
                : "COMPLETED";

        const survey: Survey = {
            id: event.event,
            name: getSurveyNameBySurveyFormType(surveyFormType, {
                eventId: event.event,
                surveyName,
                orgUnitName: event.orgUnitName,
                hospitalCode,
                wardCode,
                patientCode,
            }),
            rootSurvey: {
                id:
                    surveyFormType !== "PPSSurveyForm" && surveyFormType !== "PrevalenceSurveyForm"
                        ? parentPPSSurveyId
                        : event.event,
                name:
                    surveyFormType !== "PPSSurveyForm" && surveyFormType !== "PrevalenceSurveyForm"
                        ? ""
                        : surveyName,
                surveyType: surveyFormType === "PPSSurveyForm" ? surveyType : "",
            },
            startDate: startDate,
            status:
                programId === PPS_SURVEY_FORM_ID || programId === PREVALENCE_SURVEY_FORM_ID
                    ? status
                    : event.status === "COMPLETED"
                    ? ("COMPLETED" as SURVEY_STATUSES)
                    : ("ACTIVE" as SURVEY_STATUSES),
            assignedOrgUnit: { id: event.orgUnit, name: event.orgUnitName ?? "" },
            surveyType: surveyType,
            parentWardRegisterId: parentWardRegisterId,
            surveyFormType: surveyFormType,
            childCount: undefined,
            astGuideline: customAstGuideline
                ? "CUSTOM"
                : astGuideline === "EUCAST"
                ? "EUCAST"
                : "CLSI",
            uniquePatient: { id: patientId, code: patientCode },
        };
        return survey;
    });
};
