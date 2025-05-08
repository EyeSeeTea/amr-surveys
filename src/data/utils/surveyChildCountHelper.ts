import { Id } from "@eyeseetea/d2-api";
import { FutureData, apiToFuture } from "../api-futures";
import {
    getChildProgramId,
    getDefaultProgram,
    getParentDataElementForProgram,
    isTrackerProgram,
} from "./surveyProgramHelper";
import { Future } from "../../domain/entities/generic/Future";
import {
    PPS_COUNTRY_QUESTIONNAIRE_ID,
    PPS_HOSPITAL_FORM_ID,
    PPS_PATIENT_REGISTER_ID,
    PREVALENCE_FACILITY_LEVEL_FORM_ID,
} from "../entities/D2Survey";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import { TrackerEventsResponse } from "@eyeseetea/d2-api/api/trackerEvents";
import { TrackedEntitiesParamsBase } from "@eyeseetea/d2-api/api/trackerTrackedEntities";
import { ChildCount } from "../../domain/entities/Survey";
import { AMRSurveyModule } from "../../domain/entities/AMRSurveyModule";

export const getSurveyChildCount = (
    parentProgram: Id,
    orgUnitId: Id,
    parentSurveyId: Id,
    secondaryparentId: Id | undefined,
    api: D2Api,
    modules: AMRSurveyModule[]
): FutureData<ChildCount> => {
    const defaultParentProgramId = getDefaultProgram(parentProgram, modules);

    const childIds = getChildProgramId(defaultParentProgramId, modules, parentSurveyId);

    //As of now, all child programs for a given program are of the same type,
    //so we will check only the first child
    const childId = childIds.type === "singleChild" ? childIds.value : childIds.value[0];

    if (childId) {
        const isTracker = isTrackerProgram(childId, modules);

        if (isTracker) {
            if (
                childIds.type === "singleChild" &&
                childId === PPS_PATIENT_REGISTER_ID &&
                secondaryparentId
            ) {
                return getTrackerSurveyCount(
                    childId,
                    orgUnitId,
                    secondaryparentId,
                    api,
                    modules
                ).map(eventCount => {
                    return { type: "number", value: eventCount };
                });
            } else if (childIds.type === "singleChild") {
                return getTrackerSurveyCount(childId, orgUnitId, parentSurveyId, api, modules).map(
                    eventCount => {
                        return { type: "number", value: eventCount };
                    }
                );
            } else if (secondaryparentId) {
                const eventCountsFuture = childIds.value.map(id => {
                    return getTrackerSurveyCount(
                        id,
                        orgUnitId,
                        secondaryparentId,
                        api,
                        modules
                    ).map(count => {
                        return { id: id, count: count };
                    });
                });
                const eventCounts = Future.parallel(eventCountsFuture, { concurrency: 5 });

                return eventCounts.flatMap(eventCounts => {
                    return Future.success({ type: "map", value: eventCounts });
                });
            } else {
                return Future.error(
                    new Error("secondaryparentId not provided for multichild program")
                );
            }
        } else {
            if (childIds.type === "singleChild") {
                return getEventSurveyCount(
                    childIds.value,
                    orgUnitId,
                    parentSurveyId,
                    secondaryparentId,
                    api,
                    modules
                ).map(eventCount => {
                    return { type: "number", value: eventCount };
                });
            } else {
                return Future.error(
                    new Error(
                        "Event programs in AMR Surveys have single child. It should not contain multiple children"
                    )
                );
            }
        }
    } else {
        return Future.error(new Error("Unknown Child program "));
    }
};

const asyncGetEventSurveyChildCount = async (
    page: number,
    programId: Id,
    api: D2Api,
    ouId: string,
    ouMode: TrackedEntitiesParamsBase["ouMode"],
    filterStr: string
) => {
    let response: TrackerEventsResponse<{ event: true }>;
    let count = 0;
    const pageSize = 250;

    do {
        response = await api.tracker.events
            .get({
                fields: { event: true },
                pageSize: pageSize,
                page: page,
                totalPages: true,
                program: programId,
                orgUnit: ouId,
                ouMode: ouMode,
                filter: filterStr,
            })
            .getData();
        count += response.instances.length;
        page++;
    } while (response.page < Math.ceil((response.total as number) / pageSize));

    return count;
};
const getEventSurveyCount = (
    programId: Id,
    orgUnitId: Id,
    parentSurveyId: Id,
    secondaryParentId: Id | undefined,
    api: D2Api,
    modules: AMRSurveyModule[]
): FutureData<number> => {
    const ouMode =
        programId === PPS_HOSPITAL_FORM_ID || programId === PPS_COUNTRY_QUESTIONNAIRE_ID
            ? "DESCENDANTS"
            : "SELECTED";
    const filterParentDEId = getParentDataElementForProgram(programId, modules);

    const filterStr =
        secondaryParentId === ""
            ? `${filterParentDEId}:eq:${parentSurveyId}`
            : `${filterParentDEId}:eq:${secondaryParentId} `;

    const childEventCount = asyncGetEventSurveyChildCount(
        1,
        programId,
        api,
        orgUnitId,
        ouMode,
        filterStr
    );

    return Future.fromPromise(childEventCount);
};

const getTrackerSurveyCount = (
    programId: Id,
    orgUnitId: Id,
    parentSurveyId: Id,
    api: D2Api,
    modules: AMRSurveyModule[]
): FutureData<number> => {
    const filterParentDEId = getParentDataElementForProgram(programId, modules);

    const ouMode =
        orgUnitId !== "" && programId === PREVALENCE_FACILITY_LEVEL_FORM_ID
            ? "DESCENDANTS"
            : "SELECTED";

    return apiToFuture(
        api.tracker.trackedEntities.get({
            fields: { trackedEntity: true },
            pageSize: 250,
            totalPages: true,
            program: programId,
            orgUnit: orgUnitId,
            ouMode: ouMode,
            filter: `${filterParentDEId}:eq:${parentSurveyId}`,
        })
    ).flatMap(trackedEntities => {
        if (trackedEntities.total) return Future.success(trackedEntities.total);
        else return Future.success(trackedEntities.instances.length);
    });
};
