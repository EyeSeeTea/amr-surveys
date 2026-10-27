import {
    D2CategoryOptionCombo,
    D2Event,
    dataElementIds,
    getWardEventDetails,
    WARD_DATA_PROGRAM_STAGE_ID,
} from "../WardEventD2Repository";
import { WardIdIssues } from "../../../domain/entities/Questionnaire/WardEvent";

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
                wardIdIssues: givenWardIdIssues(),
            });
        });

        it("should show a form once when two wards share a ward ID and specialty, and report the duplicate", () => {
            const events = [
                givenAWardEvent({ event: "event1", wardId: "W06", specialtyCodes: ["SPEC_A"] }),
                givenAWardEvent({ event: "event2", wardId: "W06", specialtyCodes: ["SPEC_A"] }),
            ];
            const categoryOptionCombos = [givenACategoryOptionCombo("cocA", ["W06", "SPEC_A"])];

            const result = getWardEventDetails(events, categoryOptionCombos, true);

            expect(result).toEqual({
                details: [{ formId: "cocA", wardId: "W06", specialtyCode: "SPEC_A" }],
                wardIdIssues: givenWardIdIssues({ duplicatedWardIds: ["W06 (SPEC_A)"] }),
            });
        });

        it("should keep each ward's specialty forms and not report a duplicate when wards share a ward ID with different specialties", () => {
            const events = [
                givenAWardEvent({ event: "event1", wardId: "W02", specialtyCodes: ["SPEC_A"] }),
                givenAWardEvent({ event: "event2", wardId: "W02", specialtyCodes: ["SPEC_B"] }),
            ];
            const categoryOptionCombos = [
                givenACategoryOptionCombo("cocA", ["W02", "SPEC_A"]),
                givenACategoryOptionCombo("cocB", ["W02", "SPEC_B"]),
            ];

            const result = getWardEventDetails(events, categoryOptionCombos, true);

            expect(result).toEqual({
                details: [
                    { formId: "cocA", wardId: "W02", specialtyCode: "SPEC_A" },
                    { formId: "cocB", wardId: "W02", specialtyCode: "SPEC_B" },
                ],
                wardIdIssues: givenWardIdIssues(),
            });
        });

        it("should name the specialty of an unmatched ward, so a ward with one unmatched specialty is identifiable", () => {
            const event = givenAWardEvent({
                wardId: "W04",
                specialtyCodes: ["SPEC_A", "SPEC_MISSING"],
            });
            const categoryOptionCombos = [givenACategoryOptionCombo("cocA", ["W04", "SPEC_A"])];

            const result = getWardEventDetails([event], categoryOptionCombos, true);

            expect(result).toEqual({
                details: [{ formId: "cocA", wardId: "W04", specialtyCode: "SPEC_A" }],
                wardIdIssues: givenWardIdIssues({ unmatchedWardIds: ["W04 (SPEC_MISSING)"] }),
            });
        });
    });

    describe("when disaggregatedBySpecialty is false", () => {
        it("should collapse wards recorded once per specialty under the same ward ID into one form, without reporting a duplicate", () => {
            const events = [
                givenAWardEvent({ event: "event1", wardId: "W01", specialtyCodes: ["SPEC_A"] }),
                givenAWardEvent({ event: "event2", wardId: "W01", specialtyCodes: ["SPEC_B"] }),
            ];
            const categoryOptionCombos = [givenACategoryOptionCombo("cocWardOnly", ["W01"])];

            const result = getWardEventDetails(events, categoryOptionCombos, false);

            expect(result).toEqual({
                details: [{ formId: "cocWardOnly", wardId: "W01" }],
                wardIdIssues: givenWardIdIssues(),
            });
        });

        it("should return a single detail with no specialtyCode, collapsing events that resolve to the same ward and reporting the duplicate when neither has a specialty", () => {
            const events = [
                givenAWardEvent({ event: "event1", wardId: "W01" }),
                givenAWardEvent({ event: "event2", wardId: "W01" }),
            ];
            const categoryOptionCombos = [givenACategoryOptionCombo("cocWardOnly", ["W01"])];

            const result = getWardEventDetails(events, categoryOptionCombos, false);

            expect(result).toEqual({
                details: [{ formId: "cocWardOnly", wardId: "W01" }],
                wardIdIssues: givenWardIdIssues({ duplicatedWardIds: ["W01"] }),
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
                wardIdIssues: givenWardIdIssues({ unmatchedWardIds: ["W02"] }),
            });
        });
    });

    describe("when a ward ID is lowercase", () => {
        it("should match it to its form as if it were uppercase", () => {
            const event = givenAWardEvent({ wardId: "HF036/w02" });
            const categoryOptionCombos = [givenACategoryOptionCombo("cocWardOnly", ["W02"])];

            const result = getWardEventDetails([event], categoryOptionCombos, false);

            expect(result).toEqual({
                details: [{ formId: "cocWardOnly", wardId: "HF036/W02" }],
                wardIdIssues: givenWardIdIssues(),
            });
        });
    });

    describe("when a ward event has no ward ID", () => {
        it("should count it in missingWardIdCount instead of silently dropping it", () => {
            const events = [
                givenAWardEvent({ event: "event1", wardId: "W01" }),
                givenAWardEvent({ event: "event2", wardId: "  " }),
                { ...givenAWardEvent({ event: "event3", wardId: "W03" }), dataValues: [] },
            ];
            const categoryOptionCombos = [givenACategoryOptionCombo("cocWardOnly", ["W01"])];

            const result = getWardEventDetails(events, categoryOptionCombos, false);

            expect(result).toEqual({
                details: [{ formId: "cocWardOnly", wardId: "W01" }],
                wardIdIssues: givenWardIdIssues({ missingWardIdCount: 2 }),
            });
        });
    });
});

function givenWardIdIssues(issues: Partial<WardIdIssues> = {}): WardIdIssues {
    return { unmatchedWardIds: [], duplicatedWardIds: [], missingWardIdCount: 0, ...issues };
}

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
