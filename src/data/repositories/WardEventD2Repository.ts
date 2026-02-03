import { D2Api, MetadataPick } from "../../types/d2-api";
import { WardEvent } from "../../domain/entities/Questionnaire/WardEvent";
import { WardEventRepository } from "../../domain/repositories/WardEventRepository";
import { Id } from "../../domain/entities/Ref";
import { apiToFuture, FutureData } from "../api-futures";
import { Future } from "../../domain/entities/generic/Future";
import { PREVALENCE_FACILITY_LEVEL_FORM_ID } from "../entities/D2Survey";
import { DataValue as D2DataValue } from "@eyeseetea/d2-api/api/trackerEvents";
import _c from "../../domain/entities/generic/Collection";

type D2Event = {
    event: Id;
    eventDate: string;
    programStage: Id;
    dataValues: D2DataValue[];
};

export class WardEventD2Repository implements WardEventRepository {
    constructor(private api: D2Api) {}

    get(facilityId: Id): FutureData<WardEvent[]> {
        return Future.joinObj({
            events: this.getD2Events(facilityId),
            categoryOptionCombos: this.getWardCocs(),
        }).flatMap(({ events, categoryOptionCombos }) => {
            const wardEvents = _c(events)
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
                                    eventDate: new Date(event.eventDate),
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

            return Future.success(wardEvents);
        });
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

    private getD2Events(facilityId: string): FutureData<D2Event[]> {
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: {
                    enrollments: {
                        enrolledAt: true,
                        events: {
                            event: true,
                            programStage: true,
                            dataValues: {
                                dataElement: true,
                                value: true,
                            },
                        },
                    },
                },
                program: PREVALENCE_FACILITY_LEVEL_FORM_ID,
                orgUnit: facilityId,
                ouMode: "SELECTED",
            })
        ).map(({ instances }) =>
            instances.flatMap(trackedEntity =>
                trackedEntity.enrollments.flatMap(enrollment =>
                    enrollment.events.map(event => ({
                        ...event,
                        eventDate: enrollment.enrolledAt,
                    }))
                )
            )
        );
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

type D2CategoryOptionCombo = MetadataPick<{
    categoryOptionCombos: { fields: typeof categoryOptionComboFields };
}>["categoryOptionCombos"][number];
