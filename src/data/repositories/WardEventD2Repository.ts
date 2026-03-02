import { D2Api, MetadataPick } from "../../types/d2-api";
import { WardEvent, WardEventDetails } from "../../domain/entities/Questionnaire/WardEvent";
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
} from "../entities/D2Survey";
import { DataValue as D2DataValue } from "@eyeseetea/d2-api/api/trackerEvents";
import _c from "../../domain/entities/generic/Collection";
import { OrgUnitAccess } from "../../domain/entities/User";
import { getOrgUnitByLevel } from "../../domain/entities/OrgUnit";

type D2Event = {
    event: Id;
    programStage: Id;
    dataValues: D2DataValue[];
};

export class WardEventD2Repository implements WardEventRepository {
    constructor(private api: D2Api) {}

    get(facility: OrgUnitAccess): FutureData<WardEvent[]> {
        return Future.joinObj({
            categoryOptionCombos: this.getWardCocs(),
            surveyWardEvents: this.getSurveyWardEvents(facility),
        }).flatMap(({ categoryOptionCombos, surveyWardEvents }) => {
            const wardEvents = surveyWardEvents.map(surveyWardEvent => {
                const wardEventDetails = getWardEventDetails(
                    surveyWardEvent.events,
                    categoryOptionCombos
                );

                return {
                    ...surveyWardEvent,
                    events: wardEventDetails,
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
        )
            .flatMap(({ instances }) => {
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

                return Future.parallel(
                    events.map(countryEvent =>
                        this.getFacilityEvents(facility.orgUnitId, countryEvent)
                    ),
                    { concurrency: 5 }
                );
            })
            .flatMap(facilityEvents =>
                Future.success(
                    facilityEvents.filter(facilityEvent => facilityEvent.events.length > 0)
                )
            );
    }

    private getFacilityEvents(
        facilityId: Id,
        countryEvent: { rootSurveyId: string; rootSurveyName: string; startDate: Date }
    ) {
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: trackedEntityFields,
                program: PREVALENCE_FACILITY_LEVEL_FORM_ID,
                orgUnit: facilityId,
                ouMode: "DESCENDANTS",
                filter: `${SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID}:eq:${countryEvent.rootSurveyId}`,
            })
        ).flatMap(({ instances }) =>
            Future.success({
                ...countryEvent,
                events: instances
                    .flatMap(instance =>
                        instance.enrollments.flatMap(enrollment => enrollment.events)
                    )
                    .filter(
                        event =>
                            event.programStage === WARD_DATA_PROGRAM_STAGE_ID &&
                            event.dataValues.length > 0
                    ),
            })
        );
    }

    private getWardCocs(): FutureData<D2CategoryOptionCombo[]> {
        return apiToFuture(
            this.api.metadata.get({
                categoryOptionCombos: {
                    fields: categoryOptionComboFields,
                    filter: {
                        "categoryCombo.id": { eq: AMR_WARD_ID_MED_SPE_CAT_COMBO_ID },
                        "categoryOptions.name": { in: generateWardIds(WARD_COUNT) },
                    },
                    paging: false,
                },
            })
        ).flatMap(({ categoryOptionCombos }) => {
            return Future.success(categoryOptionCombos);
        });
    }
}

const dataElementIds = {
    WARD_ID: "yAA33dsnWmY",
    WARD_TYPE_11: "iowb9y894y2",
    WARD_TYPE_112: "yoctlOcQ4jK",
};
const WARD_DATA_PROGRAM_STAGE_ID = "ikaExmORX0F";
const AMR_WARD_ID_MED_SPE_CAT_COMBO_ID = "xVP6NkmUPA9";
const WARD_COUNT = 32;
const generateWardIds = (count: number): string[] =>
    Array.from({ length: count }, (_, i) => `W${String(i + 1).padStart(2, "0")}`);

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

type D2CategoryOptionCombo = MetadataPick<{
    categoryOptionCombos: { fields: typeof categoryOptionComboFields };
}>["categoryOptionCombos"][number];

function getWardEventDetails(
    events: D2Event[],
    categoryOptionCombos: D2CategoryOptionCombo[]
): WardEventDetails[] {
    return _c(events)
        .compactMap(event => {
            if (event.programStage !== WARD_DATA_PROGRAM_STAGE_ID) return undefined;

            const getDataValue = (id: string) =>
                event.dataValues.find(dv => dv.dataElement === id)?.value.trim();

            const rawWardId = getDataValue(dataElementIds.WARD_ID);
            const uniqueWardId = rawWardId ? normalizeWardId(rawWardId) : undefined;
            const specialtyCode11 = getDataValue(dataElementIds.WARD_TYPE_11);
            const specialtyCode112 = getDataValue(dataElementIds.WARD_TYPE_112);

            if (uniqueWardId && (specialtyCode11 || specialtyCode112)) {
                return _c([specialtyCode11, specialtyCode112])
                    .compactMap(specialtyCode => {
                        if (!specialtyCode) return undefined;

                        const wardEventCoc = categoryOptionCombos.find(coc => {
                            const cocNames = coc.categoryOptions.map(co => co.name);
                            const hasWardId = cocNames.some(cocName =>
                                uniqueWardId.endsWith(cocName)
                            );
                            const hasSpecialtyCode = cocNames.includes(specialtyCode);

                            return hasWardId && hasSpecialtyCode;
                        });

                        if (!wardEventCoc) {
                            console.warn(
                                `No matching category option combo for ward event with ward ID ${uniqueWardId} and specialty code ${specialtyCode}`
                            );
                            return undefined;
                        }

                        return {
                            formId: wardEventCoc.id,
                            wardId: uniqueWardId,
                            specialtyCode: specialtyCode,
                        };
                    })
                    .value();
            }

            return undefined;
        })
        .flatten()
        .value();
}

const countryLevel = 3;
