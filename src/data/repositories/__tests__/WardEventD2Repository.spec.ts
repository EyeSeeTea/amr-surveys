import {
    D2CategoryOptionCombo,
    D2Event,
    dataElementIds,
    getWardEventDetails,
    WARD_DATA_PROGRAM_STAGE_ID,
} from "../WardEventD2Repository";

describe("getWardEventDetails", () => {
    describe("when disaggregatedBySpecialty is true", () => {
        it("should return one WardEventDetails per specialty code, each with its specialtyCode", () => {
            const event = givenAWardEvent({
                wardId: "W01",
                specialtyCodes: ["SPEC_A", "SPEC_B"],
            });
            const categoryOptionCombos = [
                givenACategoryOptionCombo("cocA", ["W01", "SPEC_A"]),
                givenACategoryOptionCombo("cocB", ["W01", "SPEC_B"]),
            ];

            const result = getWardEventDetails([event], categoryOptionCombos, true);

            expect(result).toEqual({
                details: [
                    { formId: "cocA", wardId: "W01", specialtyCode: "SPEC_A" },
                    { formId: "cocB", wardId: "W01", specialtyCode: "SPEC_B" },
                ],
                unmatchedWardIds: [],
            });
        });
    });

    describe("when disaggregatedBySpecialty is false", () => {
        it("should return a single detail with no specialtyCode, collapsing events that resolve to the same ward", () => {
            const events = [
                givenAWardEvent({ event: "event1", wardId: "W01" }),
                givenAWardEvent({ event: "event2", wardId: "W01" }),
            ];
            const categoryOptionCombos = [givenACategoryOptionCombo("cocWardOnly", ["W01"])];

            const result = getWardEventDetails(events, categoryOptionCombos, false);

            expect(result).toEqual({
                details: [{ formId: "cocWardOnly", wardId: "W01" }],
                unmatchedWardIds: [],
            });
        });
    });

    describe("when a ward event's category option combo doesn't match", () => {
        it("should drop it from details and surface its ward ID in unmatchedWardIds instead of silently disappearing", () => {
            const events = [
                givenAWardEvent({ event: "event1", wardId: "W01" }),
                givenAWardEvent({ event: "event2", wardId: "W02" }),
            ];
            const categoryOptionCombos = [givenACategoryOptionCombo("cocWardOnly", ["W01"])];

            const result = getWardEventDetails(events, categoryOptionCombos, false);

            expect(result).toEqual({
                details: [{ formId: "cocWardOnly", wardId: "W01" }],
                unmatchedWardIds: ["W02"],
            });
        });
    });
});

function givenAWardEvent(options: {
    wardId: string;
    event?: string;
    specialtyCodes?: [string] | [string, string];
}): D2Event {
    const { wardId, event = "event1", specialtyCodes = [] } = options;

    return {
        event,
        programStage: WARD_DATA_PROGRAM_STAGE_ID,
        dataValues: [
            givenADataValue(dataElementIds.WARD_ID, wardId),
            ...(specialtyCodes[0]
                ? [givenADataValue(dataElementIds.WARD_TYPE_11, specialtyCodes[0])]
                : []),
            ...(specialtyCodes[1]
                ? [givenADataValue(dataElementIds.WARD_TYPE_112, specialtyCodes[1])]
                : []),
        ],
    };
}

function givenADataValue(dataElement: string, value: string): D2Event["dataValues"][number] {
    return {
        dataElement,
        value,
        updatedAt: "2024-01-01T00:00:00.000",
        createdAt: "2024-01-01T00:00:00.000",
        storedBy: "test-user",
    };
}

function givenACategoryOptionCombo(
    id: string,
    categoryOptionNames: string[]
): D2CategoryOptionCombo {
    return {
        id,
        categoryOptions: categoryOptionNames.map(name => ({ id: name, name })),
    };
}
