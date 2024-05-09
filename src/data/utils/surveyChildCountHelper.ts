import { Id } from "@eyeseetea/d2-api";
import { FutureData, apiToFuture } from "../api-futures";
import {
    getChildProgramId,
    getParentDataElementForProgram,
    isTrackerProgram,
} from "./surveyProgramHelper";
import { ProgramCountMap } from "../../domain/entities/Program";
import { Future } from "../../domain/entities/generic/Future";
import {
    PPS_COUNTRY_QUESTIONNAIRE_ID,
    PPS_HOSPITAL_FORM_ID,
    PREVALENCE_FACILITY_LEVEL_FORM_ID,
} from "../entities/D2Survey";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { TrackedEntitiesGetResponse } from "@eyeseetea/d2-api/api/trackerTrackedEntities";

export type SurveyChildCountType =
    | { type: "value"; value: FutureData<number> }
    | { type: "map"; value: FutureData<ProgramCountMap> };

export const getSurveyChildCount = (
    parentProgram: Id,
    orgUnitId: Id,
    parentSurveyId: Id,
    secondaryparentId: Id | undefined,
    api: D2Api
): SurveyChildCountType => {
    const childIds = getChildProgramId(parentProgram);

    //As of now, all child programs for a given program are of the same type,
    //so we will check only the first child

    const childId = childIds.type === "singleChild" ? childIds.value : childIds.value[0];

    if (childId) {
        const isTracker = isTrackerProgram(childId);

        if (isTracker) {
            if (childIds.type === "singleChild") {
                const eventCount = getTrackerSurveyCount(childId, orgUnitId, parentSurveyId, api);

                return { type: "value", value: eventCount };
            } else {
                const eventCounts = childIds.value.map(id => {
                    return getTrackerSurveyCount(id, orgUnitId, parentSurveyId, api).map(count => {
                        return { id: id, count: count };
                    });
                });

                return { type: "map", value: Future.sequential(eventCounts) };
            }
        } else {
            if (childIds.type === "singleChild") {
                const eventCount = getEventSurveyCount(
                    childIds.value,
                    orgUnitId,
                    parentSurveyId,
                    secondaryparentId,
                    api
                );

                return { type: "value", value: eventCount };
            } else {
                return {
                    type: "map",
                    value: Future.error(
                        new Error(
                            "Event programs in AMR Surveys have single child. It should not contain multiple children"
                        )
                    ),
                };
            }
        }
    } else {
        return {
            type: "value",
            value: Future.error(new Error("Unknown Child program ")),
        };
    }
};

const getEventSurveyCount = (
    programId: Id,
    orgUnitId: Id,
    parentSurveyId: Id,
    secondaryParentId: Id | undefined,
    api: D2Api
): FutureData<number> => {
    const ouId = programId === PPS_COUNTRY_QUESTIONNAIRE_ID ? "" : orgUnitId;
    const ouMode = programId === PPS_HOSPITAL_FORM_ID ? "DESCENDANTS" : undefined;
    const filterParentDEId = getParentDataElementForProgram(programId);

    const filterStr =
        secondaryParentId === ""
            ? `${filterParentDEId}:eq:${parentSurveyId}`
            : `${filterParentDEId}:eq:${secondaryParentId} `;

    return apiToFuture(
        api.tracker.events.get({
            fields: { event: true },
            program: programId,
            orgUnit: ouId,
            ouMode: ouMode,
            filter: filterStr,
        })
    ).flatMap(response => {
        return Future.success(response.instances.length);
    });
};

const getTrackerSurveyCount = (
    programId: Id,
    orgUnitId: Id,
    parentSurveyId: Id,
    api: D2Api
): FutureData<number> => {
    const filterParentDEId = getParentDataElementForProgram(programId);

    const ouMode =
        orgUnitId !== "" && programId === PREVALENCE_FACILITY_LEVEL_FORM_ID
            ? "DESCENDANTS"
            : undefined;

    return apiToFuture(
        api.tracker.trackedEntities.get({
            fields: { trackedEntity: true },
            program: programId,
            orgUnit: orgUnitId,
            ouMode: ouMode,
            filter: `${filterParentDEId}:eq:${parentSurveyId}`,
        })
    ).flatMap((trackedEntities: TrackedEntitiesGetResponse) => {
        return Future.success(trackedEntities.instances.length);
    });
};
