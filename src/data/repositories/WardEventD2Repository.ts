import { D2Api, MetadataPick } from "../../types/d2-api";
import {
    WardEvent,
    WardEventDetails,
    WardIdIssues,
} from "../../domain/entities/Questionnaire/WardEvent";
import { WardEventRepository } from "../../domain/repositories/WardEventRepository";
import { Id } from "../../domain/entities/Ref";
import { apiToFuture, FutureData } from "../api-futures";
import { Future } from "../../domain/entities/generic/Future";
import {
    PREVALENCE_FACILITY_LEVEL_FORM_ID,
    PREVALENCE_START_DATE_DATAELEMENT_ID,
    PREVALENCE_SURVEY_FORM_ID,
    PREVALENCE_SURVEY_NAME_DATAELEMENT_ID,
    SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID,
    WARD_STATISTICS_FORM_CONFIG,
} from "../entities/D2Survey";
import { DataValue as D2DataValue } from "@eyeseetea/d2-api/api/trackerEvents";
import _c from "../../domain/entities/generic/Collection";
import { OrgUnitAccess } from "../../domain/entities/User";
import { getOrgUnitByLevel } from "../../domain/entities/OrgUnit";
import { WardStatisticsFormType } from "../../domain/entities/Survey";
import { Maybe } from "../../utils/ts-utils";

export type D2Event = {
    event: Id;
    programStage: Id;
    dataValues: D2DataValue[];
};

export class WardEventD2Repository implements WardEventRepository {
    constructor(private api: D2Api) {}

    get(facility: OrgUnitAccess, wardFormType: WardStatisticsFormType): FutureData<WardEvent[]> {
        const { attributeCategoryComboId, disaggregatedBySpecialty } =
            WARD_STATISTICS_FORM_CONFIG[wardFormType];

        return Future.joinObj({
            categoryOptionCombos: this.getWardCocs(attributeCategoryComboId),
            surveyWardEvents: this.getSurveyWardEvents(facility),
        }).flatMap(({ categoryOptionCombos, surveyWardEvents }) => {
            const wardEvents = surveyWardEvents.map(surveyWardEvent => {
                const { details, wardIdIssues } = getWardEventDetails(
                    surveyWardEvent.events,
                    categoryOptionCombos,
                    disaggregatedBySpecialty
                );

                return {
                    ...surveyWardEvent,
                    events: details,
                    wardIdIssues,
                };
            });

            return Future.success(wardEvents);
        });
    }

    private getSurveyWardEvents(facility: OrgUnitAccess) {
        const countryOU = getOrgUnitByLevel(facility, countryLevel);

        return apiToFuture(
            this.api.tracker.events.get({
                fields: { $all: true },
                program: PREVALENCE_SURVEY_FORM_ID,
                orgUnit: countryOU.orgUnitId,
                ouMode: "SELECTED",
            })
        ).flatMap(({ instances }) => {
            const events = _c(instances)
                .compactMap(instance => {
                    const getDataValue = (dataElementId: string) =>
                        instance.dataValues.find(dv => dv.dataElement === dataElementId)?.value;
                    const rootSurveyName = getDataValue(PREVALENCE_SURVEY_NAME_DATAELEMENT_ID);
                    const startDate = getDataValue(PREVALENCE_START_DATE_DATAELEMENT_ID);

                    if (!rootSurveyName || !startDate) {
                        console.warn(
                            `Missing root survey name or start date for survey with id ${instance.event}`
                        );
                        return undefined;
                    }

                    return {
                        rootSurveyId: instance.event,
                        rootSurveyName: rootSurveyName,
                        startDate: new Date(startDate),
                    };
                })
                .value();

            return this.getFacilityEvents(facility.orgUnitId, events);
        });
    }

    private getFacilityEvents(
        facilityId: Id,
        events: { rootSurveyId: string; rootSurveyName: string; startDate: Date }[]
    ) {
        const rootSurveyIds = events.map(e => e.rootSurveyId).join(";");
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: trackedEntityFields,
                program: PREVALENCE_FACILITY_LEVEL_FORM_ID,
                orgUnit: facilityId,
                ouMode: "DESCENDANTS",
                filter: `${SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID}:in:${rootSurveyIds}`,
            })
        ).flatMap(({ instances }) =>
            Future.success(
                events
                    .map(event => ({
                        ...event,
                        events: instances.flatMap(instance => {
                            const matchesRootSurveyId =
                                instance.attributes.find(
                                    attr =>
                                        attr.attribute === SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID
                                )?.value === event.rootSurveyId;
                            if (!matchesRootSurveyId) return [];

                            return instance.enrollments
                                .flatMap(enrollment => enrollment.events)
                                .filter(
                                    event =>
                                        event.programStage === WARD_DATA_PROGRAM_STAGE_ID &&
                                        event.dataValues.length > 0
                                );
                        }),
                    }))
                    .filter(facilityEvent => facilityEvent.events.length > 0)
            )
        );
    }

    private getWardCocs(categoryComboId: Id): FutureData<D2CategoryOptionCombo[]> {
        return apiToFuture(
            this.api.metadata.get({
                categoryOptionCombos: {
                    fields: categoryOptionComboFields,
                    filter: { "categoryCombo.id": { eq: categoryComboId } },
                    paging: false,
                },
            })
        ).flatMap(({ categoryOptionCombos }) => {
            return Future.success(categoryOptionCombos);
        });
    }
}

export const dataElementIds = {
    WARD_ID: "yAA33dsnWmY",
    WARD_TYPE_11: "iowb9y894y2",
    WARD_TYPE_112: "yoctlOcQ4jK",
};
export const WARD_DATA_PROGRAM_STAGE_ID = "ikaExmORX0F";

const normalizeWardId = (wardId: string): string => {
    const match = wardId.match(/W([1-9])$/);
    if (match && match[1]) {
        return wardId.slice(0, -2) + `W${match[1].padStart(2, "0")}`;
    }
    return wardId;
};

const categoryOptionComboFields = {
    id: true,
    categoryOptions: {
        id: true,
        name: true,
    },
} as const;

const trackedEntityFields = {
    attributes: true,
    enrollments: {
        events: {
            programStage: true,
            dataValues: {
                dataElement: true,
                value: true,
            },
            event: true,
        },
    },
    orgUnit: true,
    trackedEntity: true,
} as const;

export type D2CategoryOptionCombo = MetadataPick<{
    categoryOptionCombos: { fields: typeof categoryOptionComboFields };
}>["categoryOptionCombos"][number];

type WardEventDetailsResult = {
    details: WardEventDetails[];
    wardIdIssues: WardIdIssues;
};

type WardEventResolution =
    | { status: "matched"; detail: WardEventDetails }
    | { status: "unmatched"; wardId: string };

export function getWardEventDetails(
    events: D2Event[],
    categoryOptionCombos: D2CategoryOptionCombo[],
    disaggregatedBySpecialty: boolean
): WardEventDetailsResult {
    const wardEvents = events.filter(event => event.programStage === WARD_DATA_PROGRAM_STAGE_ID);
    const identifiedWardEvents = _c(wardEvents)
        .compactMap(event => {
            const wardId = getUniqueWardId(event);
            return wardId ? { event, wardId } : undefined;
        })
        .value();

    const resolutions = _c(identifiedWardEvents)
        .flatMap(({ event, wardId }) => {
            const specialtyCodes = disaggregatedBySpecialty
                ? getSpecialtyCodes(event)
                : [undefined];

            return _c(specialtyCodes).map(specialtyCode =>
                resolveWardEventDetail(wardId, specialtyCode, categoryOptionCombos)
            );
        })
        .value();

    // Wards sharing a Unique ward ID resolve to the same form, so it is shown once
    const details = _c(resolutions)
        .compactMap(resolution => (resolution.status === "matched" ? resolution.detail : undefined))
        .uniqBy(detail => detail.formId)
        .value();

    const unmatchedWardIds = _c(resolutions)
        .compactMap(resolution =>
            resolution.status === "unmatched" ? resolution.wardId : undefined
        )
        .uniq()
        .value();

    // A ward with several specialties may be recorded once per specialty under the same ward ID,
    // so only the same ward ID with the same specialty on two wards is a true duplicate
    const wardLabels = identifiedWardEvents.flatMap(({ event, wardId }) => {
        const specialtyCodes = _c(getSpecialtyCodes(event)).uniq().value();
        return specialtyCodes.length > 0
            ? specialtyCodes.map(specialtyCode => getWardLabel(wardId, specialtyCode))
            : [wardId];
    });
    const duplicatedWardIds = _c(
        wardLabels.filter((wardLabel, index) => wardLabels.indexOf(wardLabel) !== index)
    )
        .uniq()
        .value();

    return {
        details,
        wardIdIssues: {
            unmatchedWardIds,
            duplicatedWardIds,
            missingWardIdCount: wardEvents.length - identifiedWardEvents.length,
        },
    };
}

function getWardLabel(wardId: string, specialtyCode: Maybe<string>): string {
    return specialtyCode ? `${wardId} (${specialtyCode})` : wardId;
}

function getUniqueWardId(event: D2Event): Maybe<string> {
    const rawWardId = event.dataValues
        .find(dv => dv.dataElement === dataElementIds.WARD_ID)
        ?.value.trim()
        .toUpperCase();

    return rawWardId ? normalizeWardId(rawWardId) : undefined;
}

function getSpecialtyCodes(event: D2Event): string[] {
    const getDataValue = (id: string) =>
        event.dataValues.find(dv => dv.dataElement === id)?.value.trim();

    return _c([
        getDataValue(dataElementIds.WARD_TYPE_11),
        getDataValue(dataElementIds.WARD_TYPE_112),
    ])
        .compact()
        .value();
}

function resolveWardEventDetail(
    wardId: string,
    specialtyCode: Maybe<string>,
    categoryOptionCombos: D2CategoryOptionCombo[]
): WardEventResolution {
    const wardEventCoc = categoryOptionCombos.find(coc => {
        const cocNames = coc.categoryOptions.map(co => co.name);
        const hasWardId = cocNames.some(cocName => wardId.endsWith(cocName));
        const hasSpecialtyCode = specialtyCode === undefined || cocNames.includes(specialtyCode);

        return hasWardId && hasSpecialtyCode;
    });

    if (!wardEventCoc) {
        const specialtySuffix = specialtyCode ? ` and specialty code ${specialtyCode}` : "";
        console.warn(
            `No matching category option combo for ward event with ward ID ${wardId}${specialtySuffix}`
        );
        return { status: "unmatched", wardId: getWardLabel(wardId, specialtyCode) };
    }

    return {
        status: "matched",
        detail: specialtyCode
            ? { formId: wardEventCoc.id, wardId, specialtyCode }
            : { formId: wardEventCoc.id, wardId },
    };
}

const countryLevel = 3;
