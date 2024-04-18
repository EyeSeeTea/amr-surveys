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
} from "../entities/D2Survey";
import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { getSurveyNameBySurveyFormType } from "./surveyProgramHelper";
import { Id } from "../../domain/entities/Ref";
import { FutureData } from "../api-futures";
import { ProgramCountMap } from "../../domain/entities/Program";
import { getProgramId } from "../../domain/utils/PPSProgramsHelper";
import { Future } from "../../domain/entities/generic/Future";

export const mapTrackedEntityToSurveyWithChildren = (
    trackedEntities: TrackedEntitiesGetResponse,
    surveyFormType: SURVEY_FORM_TYPES,
    getSurveyChildCount: (
        parentProgram: Id,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId?: Id | undefined
    ) =>
        | { type: "value"; value: FutureData<number> }
        | { type: "map"; value: FutureData<ProgramCountMap> }
): FutureData<Survey[]> => {
    const surveys = trackedEntities.instances.map(trackedEntity => {
        const parentPrevalenceSurveyId =
            trackedEntity.attributes?.find(
                attribute =>
                    attribute.attribute === SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID ||
                    attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF ||
                    attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL ||
                    attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS ||
                    attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL ||
                    attribute.attribute === AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF
            )?.value ?? "";

        const programId = getProgramId(surveyFormType);

        return getSurveyChildCount(
            programId,
            trackedEntity.orgUnit ?? "",
            parentPrevalenceSurveyId,
            surveyFormType === "PPSWardRegister" ? trackedEntity.trackedEntity : ""
        ).value.map(childCount => {
            const count =
                typeof childCount === "number"
                    ? childCount
                    : childCount
                          .map(child => child.count)
                          .reduce((agg, childCount) => agg + childCount, 0);

            const survey: Survey = {
                id: trackedEntity.trackedEntity ?? "",
                name: trackedEntity.trackedEntity ?? "",
                rootSurvey: {
                    id: parentPrevalenceSurveyId ?? "",
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
                parentWardRegisterId: undefined,
                surveyFormType: surveyFormType,
                childCount: count,
            };
            return survey;
        });
    });
    return Future.sequential(surveys);
};

export const mapEventToSurveyWithChildren = (
    events: D2TrackerEvent[],
    surveyFormType: SURVEY_FORM_TYPES,
    programId: Id,
    getSurveyChildCount: (
        parentProgram: Id,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId?: Id | undefined
    ) =>
        | { type: "value"; value: FutureData<number> }
        | { type: "map"; value: FutureData<ProgramCountMap> }
): FutureData<Survey[]> => {
    const surveys = events.map((event: D2TrackerEvent) => {
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
        const patientCode = surveyProperties.get("patientCode") ?? "";
        const parentPPSSurveyId = surveyProperties.get("parentPPSSurveyId") ?? "";
        const surveyType = surveyProperties.get("surveyType") ?? "";
        const parentWardRegisterId = surveyProperties.get("parentWardRegisterId") ?? "";

        const status =
            surveyCompleted === "false" && startDate
                ? startDate > new Date()
                    ? "FUTURE"
                    : "ACTIVE"
                : "COMPLETED";

        const rootSurveyId =
            surveyFormType !== "PPSSurveyForm" && surveyFormType !== "PrevalenceSurveyForm"
                ? parentPPSSurveyId
                : event.event;

        return getSurveyChildCount(
            programId,
            event.orgUnit ?? "",
            rootSurveyId,
            surveyFormType === "PPSWardRegister" ? event.event : ""
        ).value.map(childCount => {
            const count =
                typeof childCount === "number"
                    ? childCount
                    : childCount
                          .map(child => child.count)
                          .reduce((agg, childCount) => agg + childCount, 0);

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
                    id: rootSurveyId,
                    name:
                        surveyFormType !== "PPSSurveyForm" &&
                        surveyFormType !== "PrevalenceSurveyForm"
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
                childCount: count,
            };
            return survey;
        });
    });
    return Future.sequential(surveys);
};
