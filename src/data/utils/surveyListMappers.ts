import { D2TrackerTrackedEntitySchema } from "@eyeseetea/d2-api/api/trackerTrackedEntities";
import { SURVEY_FORM_TYPES, Survey } from "../../domain/entities/Survey";
import {
    PPS_SURVEY_FORM_ID,
    PREVALENCE_SURVEY_FORM_ID,
    keyToDataElementMap,
    AMR_SURVEYS_PREVALENCE_TEA_HOSPITAL_ID,
    SURVEY_ID_PATIENT_TEA_ID,
    WARD_ID_TEA_ID,
    SURVEY_PATIENT_CODE_TEA_ID,
    parentPrevalenceSurveyIdList,
    patientIdList,
} from "../entities/D2Survey";
import { getSurveyNameBySurveyFormType } from "./surveyProgramHelper";
import { Id } from "../../domain/entities/Ref";
import { SelectedPick } from "@eyeseetea/d2-api/api";
import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { OrgUnitBasic } from "../../domain/entities/OrgUnit";

export const trackedEntityFields = {
    attributes: true,
    enrollments: {
        createdAt: true,
    },
    trackedEntity: true,
    orgUnit: true,
} as const;

export type D2TrackerEntitySelectedPick = SelectedPick<
    D2TrackerTrackedEntitySchema,
    typeof trackedEntityFields
>;

export const mapTrackedEntityToSurvey = (
    trackedEntities: D2TrackerEntitySelectedPick[],
    surveyFormType: SURVEY_FORM_TYPES,
    orgUnits?: OrgUnitBasic[]
): Survey[] => {
    return trackedEntities.map(trackedEntityInstance => {
        const parentPrevalenceSurveyId =
            trackedEntityInstance.attributes?.find(attribute =>
                parentPrevalenceSurveyIdList.includes(attribute.attribute)
            )?.value ?? "";

        const parentPPSSurveyId =
            trackedEntityInstance.attributes?.find(
                attr => attr.attribute === SURVEY_ID_PATIENT_TEA_ID
            )?.value ?? "";

        const patientId =
            trackedEntityInstance.attributes?.find(attribute =>
                patientIdList.includes(attribute.attribute)
            )?.value ?? "";

        const patientCode =
            trackedEntityInstance.attributes?.find(
                attribute => attribute.attribute === SURVEY_PATIENT_CODE_TEA_ID
            )?.value ?? "";

        const facilityCode =
            trackedEntityInstance.attributes?.find(
                attribute => attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_HOSPITAL_ID
            )?.value ?? "";

        const parentWardId =
            trackedEntityInstance.attributes?.find(
                attribute => attribute.attribute === WARD_ID_TEA_ID
            )?.value ?? "";

        const createdAt = trackedEntityInstance.enrollments[0]?.createdAt;

        const orgUnit = orgUnits?.find(ou => ou.id === trackedEntityInstance.orgUnit);

        const survey: Survey = {
            id: trackedEntityInstance.trackedEntity ?? "",
            name: trackedEntityInstance.trackedEntity ?? "",
            rootSurvey: {
                id:
                    surveyFormType === "PPSPatientRegister"
                        ? parentPPSSurveyId
                        : parentPrevalenceSurveyId,
                name: "",
                surveyType: "",
            },
            startDate: createdAt ? new Date(createdAt) : undefined,
            status: "ACTIVE",
            assignedOrgUnit: {
                id: trackedEntityInstance.orgUnit ?? "",
                name: orgUnit?.name ?? "",
                code: orgUnit?.code ?? "",
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
    programId: Id,
    orgUnits?: OrgUnitBasic[]
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

        const orgUnit = orgUnits?.find(ou => ou.id === event.orgUnit);

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
                    ? "COMPLETED"
                    : "ACTIVE",
            assignedOrgUnit: {
                ...orgUnit,
                id: event.orgUnit,
                name: orgUnit?.name ?? "",
                code: orgUnit?.code ?? "",
            },
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
