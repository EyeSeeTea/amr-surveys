import {
    assignSheetNames,
    assignStageChildKey,
    buildStageChildForm,
    buildTrackerRecords,
    candidateProgramIds,
    codeKey,
    computeColumnCount,
    configuredColumns,
    describeColumns,
    createLimiter,
    emptyIntegrityReport,
    expectedRecordCounts,
    fetchAllPages,
    flagIdMismatches,
    flagRecords,
    forecastWorkbook,
    formatBytes,
    fullWardCode,
    howTheSheetsLink,
    linkColumnsFor,
    linkParents,
    makePageGuard,
    mapWithConcurrency,
    mergeByFormKey,
    orderColumns,
    pascalizeStageName,
    programsToExtract,
    placeSpeciesOtherAfterSpecies,
    resolveFacilityIds,
    resolveReadableCodes,
    sheetColumns,
    summariseFlags,
    toCellValue,
    uniqueLabels,
} from "../extract-forms";
import type { AMRSurveyModule } from "../../domain/entities/AMRSurveyModule";
import { describe, expect, it, vi } from "vitest";
import type {
    FormData,
    OffFormTracker,
    ReferenceStatus,
    FormDiscovery,
    ProgramMeta,
    ProgramStageMeta,
    Record_,
    ResolvedForm,
} from "../extract-forms";
import {
    AMR_SURVEYS_PREVALENCE_TEA_HOSPITAL_ID,
    AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID,
    PREVALENCE_CASE_REPORT_FORM_ID,
    PREVALENCE_FACILITY_LEVEL_FORM_ID,
    PREVALENCE_MORTALITY_FOLLOWUP_FORM,
    PREVALENCE_SURVEY_FORM_ID,
    PREVALENCE_SURVEY_NAME_DATAELEMENT_ID,
} from "../../data/entities/D2Survey";

function form(overrides: Partial<ResolvedForm> & Pick<ResolvedForm, "key">): ResolvedForm {
    return {
        requestedName: overrides.key,
        title: overrides.key,
        uid: `${overrides.key}-uid`,
        serverName: overrides.key,
        kind: "tracker",
        defaultUid: `${overrides.key}-uid`,
        isCustom: false,
        parentLinkField: "",
        surveyLinkField: "",
        ...overrides,
    };
}

function record(overrides: Partial<Record_> & Pick<Record_, "id">): Record_ {
    return {
        parentId: "",
        surveyId: "",
        facilityId: "",
        orgUnit: "OU1",
        values: new Map(),
        meta: new Map(),
        flags: [],
        ...overrides,
    };
}

function stage(
    overrides: Partial<ProgramStageMeta> & Pick<ProgramStageMeta, "id" | "name">
): ProgramStageMeta {
    return {
        repeatable: false,
        sortOrder: 0,
        dataElementLabels: new Map(),
        dataElementOrder: new Map(),
        dataElementSection: new Map(),
        ...overrides,
    };
}

function programMeta(
    overrides: Partial<ProgramMeta> & { stages?: ProgramStageMeta[] } = {}
): ProgramMeta {
    const { stages, ...rest } = overrides;
    return {
        attributes: new Map(),
        attributeOrder: new Map(),
        stageById: new Map((stages ?? []).map(s => [s.id, s])),
        valueTypes: new Map(),
        optionNames: new Map(),
        fieldNames: new Map(),
        ...rest,
    };
}

function indexOf(all: FormData[]) {
    return {
        byKey: new Map(all.map(d => [d.form.key, d])),
        recordIndex: new Map(all.map(d => [d.form.key, new Map(d.records.map(r => [r.id, r]))])),
    };
}

/** The real graph: Facility and CaseReport both hang off Survey; leaves hang off CaseReport. */
function realGraphForms() {
    return {
        survey: form({
            key: "Survey",
            uid: PREVALENCE_SURVEY_FORM_ID,
            defaultUid: PREVALENCE_SURVEY_FORM_ID,
            kind: "event",
        }),
        facility: form({
            key: "Facility",
            uid: PREVALENCE_FACILITY_LEVEL_FORM_ID,
            defaultUid: PREVALENCE_FACILITY_LEVEL_FORM_ID,
            parentKey: "Survey",
        }),
        caseReport: form({
            key: "CaseReport",
            title: "Case report",
            uid: PREVALENCE_CASE_REPORT_FORM_ID,
            defaultUid: PREVALENCE_CASE_REPORT_FORM_ID,
            parentKey: "Survey",
        }),
        followUp: form({
            key: "FollowUpD28",
            uid: PREVALENCE_MORTALITY_FOLLOWUP_FORM,
            defaultUid: PREVALENCE_MORTALITY_FOLLOWUP_FORM,
            parentKey: "CaseReport",
        }),
    };
}

describe("linkParents", () => {
    it("links Case report to Survey, not Facility (the app filters it by parentSurveyId)", () => {
        const resolved = [
            form({
                key: "Survey",
                uid: PREVALENCE_SURVEY_FORM_ID,
                defaultUid: PREVALENCE_SURVEY_FORM_ID,
            }),
            form({
                key: "Facility",
                uid: PREVALENCE_FACILITY_LEVEL_FORM_ID,
                defaultUid: PREVALENCE_FACILITY_LEVEL_FORM_ID,
            }),
            // Deliberately wrong on the way in — linkParents must correct it.
            form({
                key: "CaseReport",
                uid: PREVALENCE_CASE_REPORT_FORM_ID,
                defaultUid: PREVALENCE_CASE_REPORT_FORM_ID,
                parentKey: "Facility",
            }),
        ];

        linkParents(resolved);

        expect(resolved.find(f => f.key === "CaseReport")?.parentKey).toBe("Survey");
        expect(resolved.find(f => f.key === "Facility")?.parentKey).toBe("Survey");
    });

    it("links a custom leaf form to Case report via the default UID it overrides", () => {
        const resolved = [
            form({
                key: "CaseReport",
                uid: "custom-crf",
                defaultUid: PREVALENCE_CASE_REPORT_FORM_ID,
                isCustom: true,
            }),
            form({
                key: "FollowUpD28",
                uid: "custom-followup",
                defaultUid: PREVALENCE_MORTALITY_FOLLOWUP_FORM,
                isCustom: true,
            }),
        ];

        linkParents(resolved);

        expect(resolved.find(f => f.key === "FollowUpD28")?.parentKey).toBe("CaseReport");
    });
});

describe("linkColumnsFor", () => {
    it("gives a leaf form the survey, facility, ward and case report record IDs", () => {
        const { survey, facility, caseReport, followUp } = realGraphForms();
        const all: FormData[] = [survey, facility, caseReport, followUp].map(f => ({
            form: f,
            records: [],
            columns: new Map(),
        }));
        const { byKey } = indexOf(all);

        expect(linkColumnsFor(followUp, byKey).map(c => c.header)).toEqual([
            "Survey record ID",
            "Facility record ID",
            "Ward record ID",
            "Case report record ID",
        ]);
    });

    it("gives Case report no parent column of its own (its parent IS Survey)", () => {
        const { survey, facility, caseReport } = realGraphForms();
        const all: FormData[] = [survey, facility, caseReport].map(f => ({
            form: f,
            records: [],
            columns: new Map(),
        }));
        const { byKey } = indexOf(all);

        expect(linkColumnsFor(caseReport, byKey).map(c => c.header)).toEqual([
            "Survey record ID",
            "Facility record ID",
            "Ward record ID",
        ]);
    });

    it("gives Facility only Survey record ID, and Survey none", () => {
        const { survey, facility } = realGraphForms();
        const all: FormData[] = [survey, facility].map(f => ({
            form: f,
            records: [],
            columns: new Map(),
        }));
        const { byKey } = indexOf(all);

        expect(linkColumnsFor(facility, byKey).map(c => c.header)).toEqual(["Survey record ID"]);
        expect(linkColumnsFor(survey, byKey)).toEqual([]);
    });
});

describe("resolveFacilityIds", () => {
    it("derives Facility_id from (Survey_id, org_unit_id) since no FK exists", () => {
        const { survey, facility, caseReport } = realGraphForms();
        const all: FormData[] = [
            { form: survey, records: [record({ id: "S1", surveyId: "S1" })], columns: new Map() },
            {
                form: facility,
                records: [record({ id: "F1", surveyId: "S1", orgUnit: "OU_A" })],
                columns: new Map(),
            },
            {
                form: caseReport,
                records: [
                    record({ id: "C1", surveyId: "S1", orgUnit: "OU_A" }),
                    record({ id: "C2", surveyId: "S1", orgUnit: "OU_UNKNOWN" }),
                ],
                columns: new Map(),
            },
        ];
        const report = emptyIntegrityReport();

        resolveFacilityIds(all, "Facility", report);

        const cases = all[2]!.records;
        expect(cases[0]!.facilityId).toBe("F1");
        expect(cases[1]!.facilityId).toBe("");
        expect(report.unresolvedFacility).toEqual([{ formKey: "CaseReport", count: 1 }]);
    });

    it("does not match across surveys even when the org unit is the same", () => {
        const { survey, facility, caseReport } = realGraphForms();
        const all: FormData[] = [
            { form: survey, records: [], columns: new Map() },
            {
                form: facility,
                records: [record({ id: "F1", surveyId: "S1", orgUnit: "OU_A" })],
                columns: new Map(),
            },
            {
                form: caseReport,
                records: [record({ id: "C1", surveyId: "S2", orgUnit: "OU_A" })],
                columns: new Map(),
            },
        ];
        const report = emptyIntegrityReport();

        resolveFacilityIds(all, "Facility", report);

        expect(all[2]!.records[0]!.facilityId).toBe("");
    });

    it("reports (survey, orgUnit) pairs that match more than one Facility", () => {
        const { facility, caseReport } = realGraphForms();
        const all: FormData[] = [
            {
                form: facility,
                records: [
                    record({ id: "F1", surveyId: "S1", orgUnit: "OU_A" }),
                    record({ id: "F2", surveyId: "S1", orgUnit: "OU_A" }),
                ],
                columns: new Map(),
            },
            {
                form: caseReport,
                records: [record({ id: "C1", surveyId: "S1", orgUnit: "OU_A" })],
                columns: new Map(),
            },
        ];
        const report = emptyIntegrityReport();

        resolveFacilityIds(all, "Facility", report);

        expect(report.ambiguousFacilities).toEqual([
            { surveyId: "S1", orgUnit: "OU_A", facilityIds: ["F1", "F2"] },
        ]);
        // Still deterministic rather than silently dropped.
        expect(all[1]!.records[0]!.facilityId).toBe("F1");
    });

    it("marks a Facility record as its own facility", () => {
        const { facility } = realGraphForms();
        const all: FormData[] = [
            {
                form: facility,
                records: [record({ id: "F1", surveyId: "S1", orgUnit: "OU_A" })],
                columns: new Map(),
            },
        ];

        resolveFacilityIds(all, "Facility", emptyIntegrityReport());

        expect(all[0]!.records[0]!.facilityId).toBe("F1");
    });
});

describe("flagRecords", () => {
    const { survey, facility, caseReport, followUp } = realGraphForms();
    const noLookup = async () => new Map<string, ReferenceStatus>();
    const flagsOf = (r: Record_) => r.flags.map(f => f.flag);

    /** Survey S1 > CaseReport C1 > FollowUp U1, plus whatever extra records a test adds. */
    function graph(extra: { caseReports?: Record_[]; followUps?: Record_[] } = {}) {
        const surveyRec = record({ id: "S1", surveyId: "S1" });
        const caseRec = record({ id: "C1", surveyId: "S1", parentId: "S1" });
        const followRec = record({ id: "U1", surveyId: "S1", parentId: "C1" });
        const all: FormData[] = [
            { form: survey, records: [surveyRec], columns: new Map() },
            {
                form: caseReport,
                records: [caseRec, ...(extra.caseReports ?? [])],
                columns: new Map(),
            },
            {
                form: followUp,
                records: [followRec, ...(extra.followUps ?? [])],
                columns: new Map(),
            },
        ];
        return { all, recordIndex: indexOf(all).recordIndex, caseRec, followRec };
    }

    it("leaves consistent records unflagged and asks DHIS2 nothing", async () => {
        const { all, recordIndex, caseRec, followRec } = graph();
        const lookUp = vi.fn(noLookup);

        await flagRecords(all, recordIndex, lookUp);

        expect([...caseRec.flags, ...followRec.flags]).toEqual([]);
        expect(lookUp).not.toHaveBeenCalled();
    });

    it("flags an unknown or missing Survey_id as TEST/INVALID", async () => {
        const junk = record({ id: "C2", surveyId: "TEST SURVEY ID", parentId: "TEST SURVEY ID" });
        const blank = record({ id: "C3", surveyId: "", parentId: "" });
        const { all, recordIndex } = graph({ caseReports: [junk, blank] });

        await flagRecords(all, recordIndex, noLookup);

        expect(junk.flags).toEqual([
            {
                flag: "TEST/INVALID",
                detail: 'Survey record ID "TEST SURVEY ID" is not a survey in DHIS2',
            },
        ]);
        expect(flagsOf(blank)).toEqual(["TEST/INVALID"]);
    });

    it("tells a deleted parent from one that never existed, looking up only real ids", async () => {
        const childOfDeleted = record({ id: "U2", surveyId: "S1", parentId: "DeletedCR01" });
        const childOfJunk = record({ id: "U3", surveyId: "S1", parentId: "test" });
        const { all, recordIndex } = graph({ followUps: [childOfDeleted, childOfJunk] });
        const lookUp = vi.fn(
            async () =>
                new Map<string, ReferenceStatus>([
                    ["DeletedCR01", { status: "deleted", lastUpdated: "2025-09-29T10:38:33.383" }],
                ])
        );

        await flagRecords(all, recordIndex, lookUp);

        expect(lookUp).toHaveBeenCalledWith({ surveys: [], trackedEntities: ["DeletedCR01"] });
        expect(childOfDeleted.flags).toEqual([
            {
                flag: "PARENT DELETED",
                detail: "Case report DeletedCR01 was deleted in DHIS2 (last changed 2025-09-29)",
            },
        ]);
        expect(childOfJunk.flags).toEqual([
            { flag: "PARENT MISSING", detail: 'Case report "test" does not exist in DHIS2' },
        ]);
    });

    it("says when a parent exists but outside the extract", async () => {
        const child = record({ id: "U2", surveyId: "S1", parentId: "OtherCR0001" });
        const { all, recordIndex } = graph({ followUps: [child] });

        await flagRecords(
            all,
            recordIndex,
            async () =>
                new Map<string, ReferenceStatus>([
                    ["OtherCR0001", { status: "elsewhere", orgUnit: "Kenya" }],
                ])
        );

        expect(flagsOf(child)).toEqual(["OUTSIDE EXTRACT"]);
        expect(child.flags[0]!.detail).toContain("under Kenya");
    });

    it("flags a survey mismatch with the parent", async () => {
        const stray = record({ id: "U2", surveyId: "S_WRONG", parentId: "C1" });
        const { all, recordIndex } = graph({ followUps: [stray] });

        await flagRecords(all, recordIndex, noLookup);

        expect(flagsOf(stray)).toEqual(["TEST/INVALID", "SURVEY MISMATCH"]);
    });

    it("passes a parent's flags down to its children, including repeatable-stage rows", async () => {
        const junkCase = record({ id: "C9", surveyId: "test", parentId: "test" });
        const childOfJunk = record({ id: "U9", surveyId: "S1", parentId: "C9" });
        const { all } = graph({ caseReports: [junkCase], followUps: [childOfJunk] });

        const wardForm = buildStageChildForm(
            facility,
            stage({ id: "WARD", name: "Ward data", repeatable: true }),
            "Facility__WardData"
        );
        const junkFacility = record({ id: "F9", surveyId: "nope" });
        const wardRow = record({ id: "W9", surveyId: "nope", parentId: "F9" });
        all.push(
            { form: facility, records: [junkFacility], columns: new Map() },
            { form: wardForm, records: [wardRow], columns: new Map() }
        );

        await flagRecords(all, indexOf(all).recordIndex, noLookup);

        // Its own Survey_id (S1) also disagrees with the junk parent's, which is a finding too.
        expect(flagsOf(childOfJunk)).toEqual(["SURVEY MISMATCH", "PARENT FLAGGED"]);
        expect(childOfJunk.flags[1]!.detail).toBe("Case report C9 is flagged: TEST/INVALID");
        expect(flagsOf(wardRow)).toEqual(["PARENT FLAGGED"]);
    });

    it("skips the Survey_id check when the Survey form is not in the run", async () => {
        const caseOnly = record({ id: "C1", surveyId: "S1", parentId: "S1" });
        const all: FormData[] = [{ form: caseReport, records: [caseOnly], columns: new Map() }];

        await flagRecords(all, indexOf(all).recordIndex, noLookup);

        expect(caseOnly.flags).toEqual([]);
    });

    it("summarises flagged records per sheet and flag", async () => {
        const junk = record({ id: "C2", surveyId: "x", parentId: "x" });
        const { all, recordIndex } = graph({ caseReports: [junk] });

        await flagRecords(all, recordIndex, noLookup);

        expect(summariseFlags(all)).toEqual([
            { sheet: "Case report", flag: "TEST/INVALID", count: 1 },
        ]);
    });
});

describe("buildTrackerRecords", () => {
    const caseReport = form({ key: "CaseReport", surveyLinkField: "surveyTea" });

    it("merges a non-repeatable stage's dataValues onto the main row, prefixed by stage name", () => {
        const meta = programMeta({
            stages: [
                stage({
                    id: "STAGE1",
                    name: "Diagnosis",
                    repeatable: false,
                    dataElementLabels: new Map([["de1", "Primary site"]]),
                }),
            ],
        });
        const columns = new Map<string, string>();
        const stageColumns = new Map<string, Map<string, string>>();

        const { main, stageRecords } = buildTrackerRecords(
            {
                trackedEntity: "C1",
                orgUnit: "OU_A",
                attributes: [{ attribute: "surveyTea", value: "S1" }],
                events: [
                    {
                        event: "E1",
                        programStage: "STAGE1",
                        dataValues: [{ dataElement: "de1", value: "Lung" }],
                    },
                ],
            },
            caseReport,
            meta,
            columns,
            stageColumns
        );

        expect(main.values.get("stage:de1")).toBe("Lung");
        expect(columns.get("stage:de1")).toBe("Diagnosis: Primary site");
        expect(main.surveyId).toBe("S1");
        expect(stageRecords).toEqual([]);
    });

    it("routes a repeatable stage's events to child records instead of the main row", () => {
        const meta = programMeta({
            stages: [
                stage({
                    id: "WARD",
                    name: "Ward data",
                    repeatable: true,
                    dataElementLabels: new Map([["de2", "Ward name"]]),
                }),
            ],
        });
        const columns = new Map<string, string>();
        const stageColumns = new Map<string, Map<string, string>>();

        const { main, stageRecords } = buildTrackerRecords(
            {
                trackedEntity: "F1",
                orgUnit: "OU_A",
                events: [
                    {
                        event: "W1",
                        programStage: "WARD",
                        occurredAt: "2024-01-01",
                        dataValues: [{ dataElement: "de2", value: "ICU" }],
                    },
                    {
                        event: "W2",
                        programStage: "WARD",
                        occurredAt: "2024-02-01",
                        dataValues: [{ dataElement: "de2", value: "ER" }],
                    },
                ],
            },
            form({ key: "Facility" }),
            meta,
            columns,
            stageColumns
        );

        // The repeatable stage must NOT pollute the main row's columns.
        expect(main.values.size).toBe(0);
        expect(columns.size).toBe(0);

        expect(stageRecords).toHaveLength(2);
        expect(stageRecords[0]).toMatchObject({ stageId: "WARD" });
        expect(stageRecords[0]!.record).toMatchObject({ id: "W1", parentId: "F1" });
        expect(stageRecords[0]!.record.meta.get("occurred_at")).toBe("2024-01-01");
        expect(stageRecords[1]!.record).toMatchObject({ id: "W2", parentId: "F1" });
        expect(stageRecords[0]!.record.values.get("de2")).toBe("ICU");
        expect(stageRecords[1]!.record.values.get("de2")).toBe("ER");
        expect(stageColumns.get("WARD")?.get("de2")).toBe("Ward name");
    });

    it("copies the main row's surveyId onto repeatable-stage child records", () => {
        const meta = programMeta({
            stages: [stage({ id: "WARD", name: "Ward", repeatable: true })],
        });

        const { stageRecords } = buildTrackerRecords(
            {
                trackedEntity: "F1",
                attributes: [{ attribute: "surveyTea", value: "S9" }],
                events: [{ event: "W1", programStage: "WARD", dataValues: [] }],
            },
            form({ key: "Facility", surveyLinkField: "surveyTea" }),
            meta,
            new Map(),
            new Map()
        );

        expect(stageRecords[0]!.record.surveyId).toBe("S9");
    });

    it("ignores an event on an unknown program stage rather than throwing", () => {
        const meta = programMeta({ stages: [] });

        expect(() =>
            buildTrackerRecords(
                {
                    trackedEntity: "C1",
                    events: [
                        {
                            event: "E1",
                            programStage: "UNKNOWN",
                            dataValues: [{ dataElement: "de1", value: "x" }],
                        },
                    ],
                },
                caseReport,
                meta,
                new Map(),
                new Map()
            )
        ).not.toThrow();
    });

    it("skips a dataValue with an undefined or null value", () => {
        const meta = programMeta({
            stages: [
                stage({
                    id: "S1",
                    name: "S1",
                    repeatable: false,
                    dataElementLabels: new Map([["de1", "X"]]),
                }),
            ],
        });
        const columns = new Map<string, string>();

        const { main } = buildTrackerRecords(
            {
                trackedEntity: "C1",
                events: [
                    {
                        event: "E1",
                        programStage: "S1",
                        dataValues: [{ dataElement: "de1", value: null }],
                    },
                ],
            },
            caseReport,
            meta,
            columns,
            new Map()
        );

        expect(main.values.has("stage:de1")).toBe(false);
        expect(columns.size).toBe(0);
    });
});

describe("linkColumnsFor (repeatable-stage children)", () => {
    it("does not duplicate Facility record ID when a repeatable stage belongs to Facility itself", () => {
        const facility = form({ key: "Facility" });
        const wardStage = form({
            key: "Facility_WardData",
            kind: "trackerStage",
            parentKey: "Facility",
        });
        const all: FormData[] = [
            { form: facility, records: [], columns: new Map() },
            { form: wardStage, records: [], columns: new Map() },
        ];
        const { byKey } = indexOf(all);

        const headers = linkColumnsFor(wardStage, byKey).map(c => c.header);

        expect(headers).toEqual(["Survey record ID", "Facility record ID"]);
        expect(headers.filter(h => h === "Facility record ID")).toHaveLength(1);
    });

    it("gives a repeatable stage under Case report all four record IDs", () => {
        const { survey, facility, caseReport } = realGraphForms();
        const stageForm = form({
            key: "CaseReport_Diagnosis",
            kind: "trackerStage",
            parentKey: "CaseReport",
        });
        const all: FormData[] = [survey, facility, caseReport, stageForm].map(f => ({
            form: f,
            records: [],
            columns: new Map(),
        }));
        const { byKey } = indexOf(all);

        expect(linkColumnsFor(stageForm, byKey).map(c => c.header)).toEqual([
            "Survey record ID",
            "Facility record ID",
            "Ward record ID",
            "Case report record ID",
        ]);
    });
});

const CASE_FACILITY_CODE = "qgPNgq0Ws7k";
const CASE_WARD_CODE = "KoKmhwZGJnW";
const WARD_DATA_CODE = "yAA33dsnWmY";
const PATIENT_CODE = AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID;

/** Survey > Facility (+ its ward data) and Survey > CaseReport > FollowUp, plus ward statistics. */
function codesGraph(
    opts: {
        caseValues?: [string, string][];
        followUpPatient?: string;
        /** The follow-up form's own patient ID field (qsDC1eNnbgE). */
        followUpOwn?: string;
        extraFacility?: Record_;
        surveyId?: string;
    } = {}
) {
    const { survey, facility, caseReport, followUp } = realGraphForms();
    const wardForm = form({
        key: "Facility__WardData",
        kind: "trackerStage",
        parentKey: "Facility",
    });
    const wardStats = form({ key: "WardLevelStats", kind: "dataSet" });
    const surveyId = opts.surveyId ?? "S1";

    const surveyRec = record({
        id: "S1",
        surveyId: "S1",
        values: new Map([[PREVALENCE_SURVEY_NAME_DATAELEMENT_ID, "MALAWI AMR SURVEY "]]),
    });
    const facilityRec = record({
        id: "F1",
        surveyId: "S1",
        orgUnit: "OU_A",
        values: new Map([[AMR_SURVEYS_PREVALENCE_TEA_HOSPITAL_ID, "HF025 "]]),
    });
    const wardRec = record({
        id: "W1",
        surveyId: "S1",
        orgUnit: "OU_A",
        parentId: "F1",
        values: new Map([[WARD_DATA_CODE, "HF025/W16 "]]),
    });
    const caseRec = record({
        id: "C1",
        surveyId,
        orgUnit: "OU_A",
        parentId: surveyId,
        values: new Map(
            opts.caseValues ?? [
                [CASE_FACILITY_CODE, "HF025"],
                [CASE_WARD_CODE, "HF025/W16"],
                [PATIENT_CODE, "HF025/W16/011"],
            ]
        ),
    });
    const followUpRec = record({
        id: "U1",
        surveyId,
        orgUnit: "OU_A",
        parentId: "C1",
        values: new Map([
            [PATIENT_CODE, opts.followUpPatient ?? "HF025/W16/011 "],
            ...(opts.followUpOwn ? [["qsDC1eNnbgE", opts.followUpOwn] as [string, string]] : []),
        ]),
    });
    const statRec = record({ id: "V1", orgUnit: "OU_A", wardName: "W16" });

    const all: FormData[] = [
        { form: survey, records: [surveyRec], columns: new Map() },
        {
            form: facility,
            records: [facilityRec, ...(opts.extraFacility ? [opts.extraFacility] : [])],
            columns: new Map(),
        },
        { form: wardForm, records: [wardRec], columns: new Map() },
        { form: caseReport, records: [caseRec], columns: new Map() },
        { form: followUp, records: [followUpRec], columns: new Map() },
        { form: wardStats, records: [statRec], columns: new Map() },
    ];
    const { recordIndex } = indexOf(all);
    const report = emptyIntegrityReport();
    resolveFacilityIds(all, "Facility", report);
    resolveReadableCodes(all, recordIndex, "Facility", report);
    return {
        all,
        recordIndex,
        report,
        surveyRec,
        facilityRec,
        wardRec,
        caseRec,
        followUpRec,
        statRec,
    };
}

describe("resolveReadableCodes", () => {
    it("fills the same four codes on every sheet, trimmed", () => {
        const g = codesGraph();
        const survey = "MALAWI AMR SURVEY";

        expect(g.surveyRec.codes).toEqual({ survey, facility: "", ward: "", patient: "" });
        expect(g.facilityRec.codes).toEqual({ survey, facility: "HF025", ward: "", patient: "" });
        expect(g.wardRec.codes).toEqual({
            survey,
            facility: "HF025",
            ward: "HF025/W16",
            patient: "",
        });
        expect(g.caseRec.codes).toEqual({
            survey,
            facility: "HF025",
            ward: "HF025/W16",
            patient: "HF025/W16/011",
        });
        expect(g.followUpRec.codes).toEqual({
            survey,
            facility: "HF025",
            ward: "HF025/W16",
            patient: "HF025/W16/011",
        });
        expect(g.statRec.codes).toEqual({
            survey: "",
            facility: "HF025",
            ward: "HF025/W16",
            patient: "",
        });
    });

    it("takes a child form's facility and ward from its case report but keeps its own patient code", () => {
        const g = codesGraph({
            caseValues: [
                [CASE_FACILITY_CODE, "HF025"],
                [CASE_WARD_CODE, "HF025/W16"],
                [PATIENT_CODE, "HF025/W16/011"],
            ],
            followUpPatient: "HF025/W16/012",
        });

        expect(g.followUpRec.codes?.ward).toBe("HF025/W16");
        expect(g.followUpRec.codes?.patient).toBe("HF025/W16/012");
    });

    it("leaves Survey_name blank for a Survey_id that is not a survey", () => {
        const g = codesGraph({ surveyId: "test" });
        expect(g.caseRec.codes?.survey).toBe("");
    });

    it("links a case report to its ward-data row, and its forms copy the link", () => {
        const g = codesGraph();
        expect(g.caseRec.wardId).toBe("W1");
        expect(g.followUpRec.wardId).toBe("W1");
        expect(g.report.unresolvedWard).toEqual([]);
    });

    it("reports a case report whose ward is not on its facility's list", () => {
        const g = codesGraph({
            caseValues: [
                [CASE_FACILITY_CODE, "HF025"],
                [CASE_WARD_CODE, "HF025/W99"],
            ],
        });
        expect(g.caseRec.wardId).toBe("");
        expect(g.report.unresolvedWard).toEqual([{ formKey: "CaseReport", count: 1 }]);
    });

    it("leaves ward statistics without codes where one org unit has two Hospital IDs", () => {
        const g = codesGraph({
            extraFacility: record({
                id: "F2",
                surveyId: "S2",
                orgUnit: "OU_A",
                values: new Map([[AMR_SURVEYS_PREVALENCE_TEA_HOSPITAL_ID, "HF099"]]),
            }),
        });
        expect(g.statRec.codes).toEqual({ survey: "", facility: "", ward: "", patient: "" });
        expect(g.report.ambiguousFacilityCodes).toEqual([
            { orgUnit: "OU_A", codes: ["HF025", "HF099"] },
        ]);
    });
});

describe("flagIdMismatches", () => {
    const details = (r: Record_) => r.flags.map(f => `${f.flag}: ${f.detail}`);

    it("flags nothing when the codes agree (trailing spaces ignored)", () => {
        const g = codesGraph();
        flagIdMismatches(g.all, g.recordIndex, "Facility");
        expect(g.all.flatMap(d => d.records).flatMap(r => r.flags)).toEqual([]);
    });

    it("flags a case report whose facility code differs from the Hospital ID", () => {
        const g = codesGraph({
            caseValues: [
                [CASE_FACILITY_CODE, "HF026"],
                [CASE_WARD_CODE, "HF025/W16"],
                [PATIENT_CODE, "HF025/W16/011"],
            ],
        });
        flagIdMismatches(g.all, g.recordIndex, "Facility");
        expect(details(g.caseRec)).toEqual([
            `ID MISMATCH: Unique facility ID "HF026" differs from its facility's on the Facility form ("HF025")`,
            `ID MISMATCH: Unique ward ID "HF025/W16" does not start with its Unique facility ID "HF026/"`,
        ]);
    });

    it("flags a ward not on the facility's list and a patient code outside its ward", () => {
        const g = codesGraph({
            caseValues: [
                [CASE_FACILITY_CODE, "HF025"],
                [CASE_WARD_CODE, "HF025/W99"],
                [PATIENT_CODE, "HF025/W16/011"],
            ],
        });
        flagIdMismatches(g.all, g.recordIndex, "Facility");
        expect(details(g.caseRec)).toEqual([
            `ID MISMATCH: Unique ward ID "HF025/W99" is not among its facility's wards on the Facility form`,
            `ID MISMATCH: Unique survey patient ID "HF025/W16/011" does not start with its Unique ward ID "HF025/W99/"`,
        ]);
        // The DHIS2 link is fine, so the case report's forms are not marked PARENT FLAGGED.
        expect(g.followUpRec.flags).toEqual([]);
    });

    it("ignores case, spaces and leading zeros, and completes a bare ward", () => {
        const g = codesGraph({
            caseValues: [
                [CASE_FACILITY_CODE, "hf 25"],
                [CASE_WARD_CODE, "W16"],
                [PATIENT_CODE, "HF025/ W16/11"],
            ],
            followUpPatient: "hf025/w16/011",
        });
        flagIdMismatches(g.all, g.recordIndex, "Facility");

        expect(g.caseRec.codes?.ward).toBe("hf 25/W16");
        expect(g.caseRec.wardId).toBe("W1");
        expect(g.all.flatMap(d => d.records).flatMap(r => r.flags)).toEqual([]);
    });

    it("flags a child form whose patient code differs from its case report's", () => {
        const g = codesGraph({ followUpPatient: "HF025/W16/012" });
        flagIdMismatches(g.all, g.recordIndex, "Facility");
        expect(details(g.followUpRec)).toEqual([
            `ID MISMATCH: Unique survey patient ID "HF025/W16/012" differs from its case report's "HF025/W16/011"`,
        ]);
    });

    it("accepts the form's own patient ID field as the patient ID, with or without /C3", () => {
        for (const own of ["HF025/W16/011", "hf025/w16/011/c3"]) {
            const g = codesGraph({ followUpOwn: own });
            flagIdMismatches(g.all, g.recordIndex, "Facility");
            expect(g.followUpRec.flags).toEqual([]);
        }
    });

    it("flags the form's own patient ID field when it is another patient's", () => {
        const g = codesGraph({ followUpOwn: "HF025/W16/012/C3" });
        flagIdMismatches(g.all, g.recordIndex, "Facility");
        expect(details(g.followUpRec)).toEqual([
            `ID MISMATCH: This form's own patient ID field "HF025/W16/012/C3" is neither its Unique survey patient ID "HF025/W16/011" nor that + /C3`,
        ]);
    });

    it("does not flag blanks", () => {
        const g = codesGraph({ caseValues: [[CASE_WARD_CODE, "HF025/W16"]], followUpPatient: "" });
        flagIdMismatches(g.all, g.recordIndex, "Facility");
        expect(g.all.flatMap(d => d.records).flatMap(r => r.flags)).toEqual([]);
    });
});

describe("codeKey and fullWardCode", () => {
    it("compares codes regardless of case, spaces and leading zeros", () => {
        expect(codeKey("hf025/ w1")).toBe(codeKey("HF025/W01"));
        expect(codeKey("HF025/")).toBe(codeKey("HF025"));
        // Cyrillic "С" (U+0421) looks exactly like Latin "C".
        expect(codeKey("HF025/W16/011/С3")).toBe(codeKey("HF025/W16/011/C3"));
        expect(codeKey("HF025/W10")).not.toBe(codeKey("HF025/W1"));
        expect(codeKey("HF025//W16")).not.toBe(codeKey("HF025/W16"));
    });

    it("completes only a ward typed without its facility", () => {
        expect(fullWardCode("W16", "HF025")).toBe("HF025/W16");
        expect(fullWardCode("HF025/W16", "HF025")).toBe("HF025/W16");
        // Missing slash or the facility alone: left as typed, so the check flags it.
        expect(fullWardCode("HF025W16", "HF025")).toBe("HF025W16");
        expect(fullWardCode("HF025", "HF025")).toBe("HF025");
        expect(fullWardCode("W16", "")).toBe("W16");
        expect(fullWardCode("", "HF025")).toBe("");
    });
});

describe("howTheSheetsLink", () => {
    it("describes only the sheets present", () => {
        const g = codesGraph();
        const topics = howTheSheetsLink(g.all).map(([topic]) => topic);

        expect(topics).toEqual([
            "Colours",
            "Complete",
            "Two kinds of ID",
            "The IDs nest",
            "Survey",
            "Facility",
            "Facility__WardData",
            "Case report",
            "FollowUpD28",
            "WardLevelStats",
            "Data check",
            "In Excel",
            "Power BI / SQL",
        ]);
        const onlySurvey = howTheSheetsLink([g.all[0]!]).map(([topic]) => topic);
        expect(onlySurvey).not.toContain("Case report");
    });
});

describe("pascalizeStageName", () => {
    it("preserves word boundaries instead of blindly stripping separators", () => {
        expect(pascalizeStageName("Ward data")).toBe("WardData");
    });

    it("handles multiple words and punctuation", () => {
        expect(pascalizeStageName("SC/ID/AST point without gram stain test")).toBe(
            "SCIDASTPointWithoutGramStainTest"
        );
    });

    it("falls back to a stable placeholder for an empty/unusable name", () => {
        expect(pascalizeStageName("")).toBe("Stage");
        expect(pascalizeStageName("---")).toBe("Stage");
    });

    it("is idempotent-ish: already-PascalCase input round-trips sensibly", () => {
        expect(pascalizeStageName("Species 1")).toBe("Species1");
    });
});

describe("assignSheetNames", () => {
    it("proves the real collision case: two stage names that share a 31-char prefix no longer collide", () => {
        // This is the exact pair verified live against the server: two SampleShipment
        // stage names differing only after character 31.
        const sources = [
            { key: "SampleShipment__SCIDASTPointWithoutGramStainTest", stableId: "uid-A" },
            { key: "SampleShipment__SCIDASTPointWithGramStainTest", stableId: "uid-B" },
        ];

        const names = assignSheetNames(sources);

        const a = names.get(sources[0]!.key)!;
        const b = names.get(sources[1]!.key)!;
        expect(a).not.toBe(b);
        expect(a.length).toBeLessThanOrEqual(31);
        expect(b.length).toBeLessThanOrEqual(31);
    });

    it("never exceeds 31 characters even for a very long single key", () => {
        const names = assignSheetNames([{ key: "A".repeat(60), stableId: "uid-X" }]);
        expect([...names.values()][0]!.length).toBeLessThanOrEqual(31);
    });

    it("is deterministic: the same inputs in a different array order produce the same assignment", () => {
        const sources = [
            { key: "Zeta", stableId: "z" },
            { key: "Alpha", stableId: "a" },
            { key: "Beta", stableId: "b" },
        ];

        const forward = assignSheetNames(sources);
        const shuffled = assignSheetNames([...sources].reverse());

        expect(forward.get("Alpha")).toBe(shuffled.get("Alpha"));
        expect(forward.get("Beta")).toBe(shuffled.get("Beta"));
        expect(forward.get("Zeta")).toBe(shuffled.get("Zeta"));
    });

    it("is stable across runs: disambiguation depends on stableId, not encounter order", () => {
        const base = "X".repeat(31); // two sources that collide once truncated
        const sources = [
            { key: `${base}One`, stableId: "programStageUidOne" },
            { key: `${base}Two`, stableId: "programStageUidTwo" },
        ];

        const run1 = assignSheetNames(sources);
        const run2 = assignSheetNames([...sources]); // fresh call, same logical inputs

        expect(run1.get(sources[0]!.key)).toBe(run2.get(sources[0]!.key));
        expect(run1.get(sources[1]!.key)).toBe(run2.get(sources[1]!.key));
    });

    it("never assigns a name that collides with a reserved name", () => {
        const names = assignSheetNames(
            [{ key: "_index", stableId: "weird-form-uid" }],
            ["_index", "_relationships"]
        );
        expect(names.get("_index")).not.toBe("_index");
    });

    it("records collisions in the given IntegrityReport instead of passing silently", () => {
        const report = emptyIntegrityReport();
        const base = "Y".repeat(31);
        assignSheetNames(
            [
                { key: `${base}A`, stableId: "uidA" },
                { key: `${base}B`, stableId: "uidB" },
            ],
            [],
            report
        );
        expect(report.sheetNameCollisions).toHaveLength(1);
    });
});

describe("assignStageChildKey", () => {
    const repeatable = (id: string, name: string) => stage({ id, name, repeatable: true });

    it("builds a readable, word-boundary-preserving key", () => {
        const used = new Set<string>(["Facility"]);
        expect(assignStageChildKey("Facility", repeatable("WARD", "Ward data"), used)).toBe(
            "Facility__WardData"
        );
    });

    it("disambiguates two stages that pascalize to the same name using the stage id, deterministically", () => {
        const used = new Set<string>(["Facility"]);
        const first = assignStageChildKey("Facility", repeatable("STAGE_A", "Ward Data"), used);
        const second = assignStageChildKey("Facility", repeatable("STAGE_B", "ward-data"), used);

        expect(first).toBe("Facility__WardData");
        expect(second).toBe("Facility__WardData__STAGE_B");
        expect(first).not.toBe(second);
    });
});

describe("buildStageChildForm", () => {
    it("produces a form shaped correctly for a repeatable-stage child sheet", () => {
        const owner = form({ key: "Facility", uid: "FAC_UID", defaultUid: "FAC_DEFAULT" });
        const wardStage = stage({ id: "WARD", name: "Ward data", repeatable: true });

        const child = buildStageChildForm(owner, wardStage, "Facility__WardData");

        expect(child.key).toBe("Facility__WardData");
        expect(child.parentKey).toBe("Facility");
        expect(child.kind).toBe("trackerStage");
        expect(child.uid).toBe("FAC_UID#WARD");
        expect(child.defaultUid).toBe("FAC_DEFAULT#WARD");
        expect(child.parentLinkField).toBe("");
    });
});

describe("column order and header uniqueness", () => {
    /**
     * Mirrors the real Central Ref Lab shape that caused the reported bug: a stage that
     * repeats a 4-field block per antibiotic, every block reusing the same field names,
     * with the form's own section names ("S1 - Antibiotic 1") as the only thing telling
     * them apart.
     */
    function speciesStage(): ProgramStageMeta {
        const labels = new Map<string, string>();
        const order = new Map<string, number>();
        const section = new Map<string, string>();

        labels.set("species", "Specify the species");
        order.set("species", 0);
        section.set("species", "Species 1");

        // Two antibiotic blocks, each (antibiotic, AST result).
        for (const slot of [1, 2]) {
            const abx = `abx${slot}`;
            const ast = `ast${slot}`;
            labels.set(abx, "Specify the antibiotic");
            labels.set(ast, "AST results");
            order.set(abx, slot * 10);
            order.set(ast, slot * 10 + 1);
            section.set(abx, `S1 - Antibiotic ${slot}`);
            section.set(ast, `S1 - Antibiotic ${slot}`);
        }

        return stage({
            id: "SPECIES1",
            name: "Species 1",
            sortOrder: 0,
            dataElementLabels: labels,
            dataElementOrder: order,
            dataElementSection: section,
        });
    }

    it("puts an antibiotic next to its OWN AST result, in form order", () => {
        const meta = programMeta({ stages: [speciesStage()] });
        const columns = new Map<string, string>();

        // Deliberately encountered out of form order, as paging would produce.
        buildTrackerRecords(
            {
                trackedEntity: "C1",
                events: [
                    {
                        event: "E1",
                        programStage: "SPECIES1",
                        dataValues: [
                            { dataElement: "ast2", value: "S" },
                            { dataElement: "abx1", value: "Teicoplanin" },
                            { dataElement: "species", value: "S. aureus" },
                            { dataElement: "ast1", value: "R" },
                            { dataElement: "abx2", value: "Ceftriaxone" },
                        ],
                    },
                ],
            },
            form({ key: "CentralRefLab" }),
            meta,
            columns,
            new Map()
        );

        const ordered = uniqueLabels(orderColumns(columns, meta));

        expect([...ordered.values()]).toEqual([
            "Species 1: Specify the species",
            "S1 - Antibiotic 1: Specify the antibiotic",
            "S1 - Antibiotic 1: AST results",
            "S1 - Antibiotic 2: Specify the antibiotic",
            "S1 - Antibiotic 2: AST results",
        ]);
    });

    it("keeps each column bound to its own value after reordering", () => {
        const meta = programMeta({ stages: [speciesStage()] });
        const columns = new Map<string, string>();

        const { main } = buildTrackerRecords(
            {
                trackedEntity: "C1",
                events: [
                    {
                        event: "E1",
                        programStage: "SPECIES1",
                        dataValues: [
                            { dataElement: "abx1", value: "Teicoplanin" },
                            { dataElement: "ast1", value: "R" },
                            { dataElement: "abx2", value: "Ceftriaxone" },
                            { dataElement: "ast2", value: "S" },
                        ],
                    },
                ],
            },
            form({ key: "CentralRefLab" }),
            meta,
            columns,
            new Map()
        );

        const ordered = uniqueLabels(orderColumns(columns, meta));
        const row = [...ordered.keys()].map(key => main.values.get(key) ?? "");

        // Antibiotic 1 is R; antibiotic 2 is S. Neither drug has two AST results.
        expect(row).toEqual(["Teicoplanin", "R", "Ceftriaxone", "S"]);
    });

    it("places the free-text 'Species, other' directly after its species", () => {
        const labels = new Map([
            ["species", "Specify the species"],
            ["abx1", "Specify the antibiotic"],
            ["ast1", "AST results"],
            ["other", "Species, other"],
        ]);
        const order = new Map([
            ["species", 0],
            ["abx1", 1],
            ["ast1", 2],
            ["other", 121],
        ]);
        const meta = programMeta({
            stages: [
                stage({
                    id: "S",
                    name: "Species 1",
                    dataElementLabels: labels,
                    dataElementOrder: order,
                }),
            ],
        });
        placeSpeciesOtherAfterSpecies(labels, order);

        const columns = new Map([
            ["stage:other", "Species 1: Species, other"],
            ["stage:ast1", "Species 1: AST results"],
            ["stage:abx1", "Species 1: Specify the antibiotic"],
            ["stage:species", "Species 1: Specify the species"],
        ]);

        expect([...uniqueLabels(orderColumns(columns, meta)).values()]).toEqual([
            "Species 1: Specify the species",
            "Species 1: Species, other",
            "Species 1: Specify the antibiotic",
            "Species 1: AST results",
        ]);
    });

    it("leaves a stage without both species fields untouched", () => {
        const labels = new Map([
            ["species", "Specify the species"],
            ["abx1", "Specify the antibiotic"],
        ]);
        const order = new Map([
            ["species", 0],
            ["abx1", 1],
        ]);
        placeSpeciesOtherAfterSpecies(labels, order);
        expect([...order.entries()]).toEqual([
            ["species", 0],
            ["abx1", 1],
        ]);
    });

    it("numbers repeats in form order when sections do not disambiguate them", () => {
        const labels = new Map([
            ["a", "Please, specify"],
            ["b", "Please, specify"],
        ]);
        const order = new Map([
            ["a", 1],
            ["b", 2],
        ]);
        const meta = programMeta({
            stages: [
                stage({
                    id: "S",
                    name: "Ward data",
                    dataElementLabels: labels,
                    dataElementOrder: order,
                }),
            ],
        });

        const columns = new Map([
            ["b", "Ward data: Please, specify"],
            ["a", "Ward data: Please, specify"],
        ]);

        expect([...uniqueLabels(orderColumns(columns, meta)).entries()]).toEqual([
            ["a", "Ward data: Please, specify #1"],
            ["b", "Ward data: Please, specify #2"],
        ]);
    });

    it("leaves a label alone when it is already unique", () => {
        const meta = programMeta({
            stages: [
                stage({
                    id: "S",
                    name: "Stage",
                    dataElementLabels: new Map([["a", "Ward name"]]),
                    dataElementOrder: new Map([["a", 0]]),
                }),
            ],
        });

        const ordered = uniqueLabels(orderColumns(new Map([["a", "Stage: Ward name"]]), meta));
        expect([...ordered.values()]).toEqual(["Stage: Ward name"]);
    });

    it("orders attributes before stage data, and keeps unknown columns last", () => {
        const meta = programMeta({
            attributes: new Map([["attr", "Patient id"]]),
            attributeOrder: new Map([["attr", 0]]),
            stages: [
                stage({
                    id: "S",
                    name: "Stage",
                    dataElementLabels: new Map([["de", "Field"]]),
                    dataElementOrder: new Map([["de", 0]]),
                }),
            ],
        });

        const columns = new Map([
            ["orphaned", "Stage: Retired field"],
            ["stage:de", "Stage: Field"],
            ["attr", "Patient id"],
        ]);

        expect([...uniqueLabels(orderColumns(columns, meta)).keys()]).toEqual([
            "attr",
            "stage:de",
            "orphaned",
        ]);
    });
});

describe("buildTrackerRecords: events across all enrolments", () => {
    it("keeps events from every enrolment, not just the first", () => {
        // fetchTracker flattens enrollments[].events before calling this, so a TEI with a
        // second enrolment must not lose that enrolment's events from the extract.
        const meta = programMeta({
            stages: [
                stage({
                    id: "WARD",
                    name: "Ward data",
                    repeatable: true,
                    dataElementLabels: new Map(),
                }),
            ],
        });
        const stageColumns = new Map<string, Map<string, string>>();

        const { stageRecords } = buildTrackerRecords(
            {
                trackedEntity: "F1",
                enrollment: { enrolledAt: "2024-01-01", status: "ACTIVE" },
                events: [
                    { event: "W1", programStage: "WARD", dataValues: [] },
                    { event: "W2-from-second-enrolment", programStage: "WARD", dataValues: [] },
                ],
            },
            form({ key: "Facility" }),
            meta,
            new Map(),
            stageColumns
        );

        expect(stageRecords.map(s => s.record.id)).toEqual(["W1", "W2-from-second-enrolment"]);
    });

    it("takes enrolment-level metadata from the first enrolment", () => {
        const { main } = buildTrackerRecords(
            {
                trackedEntity: "F1",
                enrollment: { enrolledAt: "2024-01-01", status: "COMPLETED" },
                events: [],
            },
            form({ key: "Facility" }),
            programMeta(),
            new Map(),
            new Map()
        );

        expect(main.meta.get("enrolled_at")).toBe("2024-01-01");
        expect(main.meta.get("status")).toBe("COMPLETED");
    });
});

describe("buildTrackerRecords: unresolved-stage diagnostics", () => {
    it("counts (not silently drops) an event on an unknown program stage", () => {
        const meta = programMeta({ stages: [] });
        const report = emptyIntegrityReport();

        buildTrackerRecords(
            {
                trackedEntity: "C1",
                events: [
                    {
                        event: "E1",
                        programStage: "UNKNOWN",
                        dataValues: [{ dataElement: "de1", value: "x" }],
                    },
                ],
            },
            form({ key: "CaseReport" }),
            meta,
            new Map(),
            new Map(),
            report
        );

        expect(report.unresolvedStageEvents).toEqual([
            { formKey: "CaseReport", programStage: "UNKNOWN", count: 1 },
        ]);
    });

    it("does not double-count the same unresolved event across the two internal passes", () => {
        const meta = programMeta({ stages: [] });
        const report = emptyIntegrityReport();

        buildTrackerRecords(
            {
                trackedEntity: "C1",
                events: [{ event: "E1", programStage: "UNKNOWN", dataValues: [] }],
            },
            form({ key: "CaseReport" }),
            meta,
            new Map(),
            new Map(),
            report
        );

        expect(report.unresolvedStageEvents[0]!.count).toBe(1);
    });

    it("accumulates counts across multiple calls for the same form and stage", () => {
        const meta = programMeta({ stages: [] });
        const report = emptyIntegrityReport();
        const teiInput = (id: string) => ({
            trackedEntity: id,
            events: [{ event: `E-${id}`, programStage: "UNKNOWN", dataValues: [] }],
        });

        buildTrackerRecords(
            teiInput("C1"),
            form({ key: "CaseReport" }),
            meta,
            new Map(),
            new Map(),
            report
        );
        buildTrackerRecords(
            teiInput("C2"),
            form({ key: "CaseReport" }),
            meta,
            new Map(),
            new Map(),
            report
        );

        expect(report.unresolvedStageEvents).toEqual([
            { formKey: "CaseReport", programStage: "UNKNOWN", count: 2 },
        ]);
    });

    it("does not record anything when every stage resolves", () => {
        const meta = programMeta({ stages: [stage({ id: "S1", name: "S1" })] });
        const report = emptyIntegrityReport();

        buildTrackerRecords(
            { trackedEntity: "C1", events: [{ event: "E1", programStage: "S1", dataValues: [] }] },
            form({ key: "CaseReport" }),
            meta,
            new Map(),
            new Map(),
            report
        );

        expect(report.unresolvedStageEvents).toEqual([]);
    });
});

describe("buildTrackerRecords: column labels and fields no longer on the form", () => {
    it("labels a stage dataElement from its own stage config", () => {
        const meta = programMeta({
            stages: [
                stage({
                    id: "S1",
                    name: "Diagnosis",
                    dataElementLabels: new Map([["de1", "Primary site"]]),
                }),
            ],
        });
        const columns = new Map<string, string>();
        const offForm: OffFormTracker = new Map();

        buildTrackerRecords(
            {
                trackedEntity: "C1",
                events: [
                    {
                        event: "E1",
                        programStage: "S1",
                        dataValues: [{ dataElement: "de1", value: "Lung" }],
                    },
                ],
            },
            form({ key: "CaseReport" }),
            meta,
            columns,
            new Map(),
            undefined,
            offForm
        );

        expect(columns.get("stage:de1")).toBe("Diagnosis: Primary site");
        expect(offForm.size).toBe(0);
    });

    it("keeps a value whose field is no longer on its stage and notes it, counting every value", () => {
        const sortOrder = 2;
        const meta = programMeta({ stages: [stage({ id: "S1", name: "Diagnosis", sortOrder })] });
        const columns = new Map<string, string>();
        const offForm: OffFormTracker = new Map();
        const tei = (id: string) => ({
            trackedEntity: id,
            events: [
                {
                    event: `E-${id}`,
                    programStage: "S1",
                    dataValues: [{ dataElement: "oldDE", value: "IV" }],
                },
            ],
        });

        for (const id of ["C1", "C2"]) {
            const { main } = buildTrackerRecords(
                tei(id),
                form({ key: "CaseReport" }),
                meta,
                columns,
                new Map(),
                undefined,
                offForm
            );
            expect(main.values.get("stage:oldDE")).toBe("IV");
        }

        expect(columns.get("stage:oldDE")).toBe("Diagnosis: oldDE"); // placeholder until labelled
        const field = offForm.get("")?.get("stage:oldDE");
        expect(field).toMatchObject({
            kind: "dataElement",
            id: "oldDE",
            prefix: "Diagnosis: ",
            values: 2,
        });
        // After every field of its own stage, before the next stage's fields.
        expect(field!.position).toBe(1_000_000 * (2 + sortOrder) - 1);
    });

    it("notes an off-form field of a repeatable stage against that stage's sheet", () => {
        const meta = programMeta({
            stages: [stage({ id: "WARD", name: "Ward data", repeatable: true })],
        });
        const stageColumns = new Map<string, Map<string, string>>();
        const offForm: OffFormTracker = new Map();

        buildTrackerRecords(
            {
                trackedEntity: "F1",
                events: [
                    {
                        event: "W1",
                        programStage: "WARD",
                        dataValues: [{ dataElement: "oldDE", value: "x" }],
                    },
                ],
            },
            form({ key: "Facility" }),
            meta,
            new Map(),
            stageColumns,
            undefined,
            offForm
        );

        expect(stageColumns.get("WARD")?.get("oldDE")).toBe("oldDE");
        expect(offForm.get("WARD")?.get("oldDE")).toMatchObject({ prefix: "", values: 1 });
    });

    it("labels an attribute from meta.attributes, and notes one the program no longer has", () => {
        const meta = programMeta({ attributes: new Map([["attr1", "Hospital name"]]) });
        const columns = new Map<string, string>();
        const offForm: OffFormTracker = new Map();

        buildTrackerRecords(
            {
                trackedEntity: "C1",
                attributes: [
                    { attribute: "attr1", value: "Nairobi" },
                    { attribute: "oldAttr", value: "x" },
                ],
            },
            form({ key: "Facility" }),
            meta,
            columns,
            new Map(),
            undefined,
            offForm
        );

        expect(columns.get("attr1")).toBe("Hospital name");
        expect(offForm.get("")?.get("oldAttr")).toMatchObject({
            kind: "trackedEntityAttribute",
            values: 1,
        });
    });

    it("does not need a tracker", () => {
        const meta = programMeta({ stages: [stage({ id: "S1", name: "Diagnosis" })] });

        expect(() =>
            buildTrackerRecords(
                {
                    trackedEntity: "C1",
                    events: [
                        {
                            event: "E1",
                            programStage: "S1",
                            dataValues: [{ dataElement: "oldDE", value: "x" }],
                        },
                    ],
                },
                form({ key: "CaseReport" }),
                meta,
                new Map(),
                new Map()
            )
        ).not.toThrow();
    });
});

describe("orderColumns with off-form fields", () => {
    it("puts off-form columns after their stage's fields, in natural label order", () => {
        const s1 = stage({
            id: "S1",
            name: "S1",
            sortOrder: 0,
            dataElementOrder: new Map([["a", 0]]),
        });
        const s2 = stage({
            id: "S2",
            name: "S2",
            sortOrder: 1,
            dataElementOrder: new Map([["b", 0]]),
        });
        const meta = programMeta({ stages: [s1, s2] });
        const off = (id: string) => ({
            kind: "dataElement" as const,
            id,
            position: 1_000_000 * 2 - 1,
            prefix: "S1: ",
            values: 1,
        });

        const ordered = orderColumns(
            new Map([
                ["stage:b", "S2: b"],
                ["stage:r10", "S1: Route10 [not on current form]"],
                ["stage:a", "S1: a"],
                ["stage:r2", "S1: Route2 [not on current form]"],
            ]),
            meta,
            new Map([
                ["stage:r10", off("r10")],
                ["stage:r2", off("r2")],
            ])
        );

        expect([...ordered.keys()]).toEqual(["stage:a", "stage:r2", "stage:r10", "stage:b"]);
    });
});

describe("fetchAllPages", () => {
    const page = (from: number, count: number) =>
        Array.from({ length: count }, (_, i) => ({ id: `r${from + i}` }));
    const id = (r: { id: string }) => r.id;

    it("requests every known page at once and keeps page order", async () => {
        const requested: number[] = [];
        const fetchPage = async (n: number) => {
            requested.push(n);
            await new Promise(resolve => setTimeout(resolve, n === 1 ? 20 : 1)); // page 1 finishes last
            return n === 3 ? page(20, 5) : page((n - 1) * 10, 10);
        };

        const items = await fetchAllPages("F", 10, 25, fetchPage, id);

        expect(requested.slice(0, 3).sort()).toEqual([1, 2, 3]);
        expect(items.map(id)).toEqual(page(0, 25).map(id));
    });

    it("reads on past the known pages when records were added since discovery", async () => {
        const pages: Record<number, { id: string }[]> = {
            1: page(0, 10),
            2: page(10, 10),
            3: page(20, 3),
        };
        const items = await fetchAllPages("F", 10, 20, async n => pages[n] ?? [], id);

        expect(items).toHaveLength(23);
    });

    it("reads page by page without a total, and drops a record repeated across pages", async () => {
        const pages: Record<number, { id: string }[]> = {
            1: page(0, 10),
            2: [...page(9, 1), ...page(10, 4)],
        };
        const items = await fetchAllPages("F", 10, undefined, async n => pages[n] ?? [], id);

        expect(items.map(id)).toEqual(page(0, 14).map(id));
    });
});

describe("createLimiter", () => {
    it("never runs more than the limit at once, and runs everything", async () => {
        const limit = createLimiter(2);
        let active = 0;
        let peak = 0;

        const results = await Promise.all(
            [5, 1, 3, 1, 2].map(ms =>
                limit(async () => {
                    active++;
                    peak = Math.max(peak, active);
                    await new Promise(resolve => setTimeout(resolve, ms));
                    active--;
                    return ms;
                })
            )
        );

        expect(peak).toBe(2);
        expect(results).toEqual([5, 1, 3, 1, 2]);
    });

    it("frees the slot of a failed task", async () => {
        const limit = createLimiter(1);
        await expect(limit(async () => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
        await expect(limit(async () => "next")).resolves.toBe("next");
    });
});

describe("toCellValue: precision", () => {
    it("keeps numbers longer than Excel's 15 digits as text", () => {
        expect(toCellValue("1234567890123456", "NUMBER")).toBe("1234567890123456");
        expect(toCellValue("123456789012345", "NUMBER")).toBe(123456789012345);
    });
});

/** A follow-up program: a patient-ID attribute, its two link fields, a question, two stages. */
function followUpMeta(): ProgramMeta {
    return programMeta({
        attributes: new Map([
            [PATIENT_CODE, "Unique survey patient ID"],
            ["srvLink", "Survey ID"],
            ["parLink", "Patient ID"],
            ["qsDC1eNnbgE", "Unique survey patient ID (this form's own field: ___ or ___/C3)"],
        ]),
        attributeOrder: new Map([
            [PATIENT_CODE, 0],
            ["srvLink", 1],
            ["parLink", 2],
            ["qsDC1eNnbgE", 3],
        ]),
        fieldNames: new Map([
            [PATIENT_CODE, "Unique survey patient ID"],
            ["qsDC1eNnbgE", "Unique survey patient ID-Fup"],
            ["de1", "Outcome at D28"],
        ]),
        stages: [
            stage({
                id: "st1",
                name: "Follow-up",
                dataElementLabels: new Map([["de1", "Outcome"]]),
                dataElementOrder: new Map([["de1", 0]]),
            }),
            stage({
                id: "st2",
                name: "Visits",
                repeatable: true,
                dataElementLabels: new Map([["de2", "Visit date"]]),
            }),
        ],
    });
}

function followUpGraph() {
    const { survey, facility, caseReport, followUp } = realGraphForms();
    const linked = { ...followUp, surveyLinkField: "srvLink", parentLinkField: "parLink" };
    const all: FormData[] = [survey, facility, caseReport, linked].map(f => ({
        form: f,
        records: [],
        columns: new Map(),
    }));
    return { followUp: linked, byKey: new Map(all.map(d => [d.form.key, d])) };
}

describe("sheetColumns", () => {
    it("orders a patient form: identification, data check, questions, DHIS2 linking and system", () => {
        const { followUp, byKey } = followUpGraph();
        const meta = followUpMeta();
        const columns = configuredColumns(meta, "tracker");
        const sheet = sheetColumns(
            { form: followUp, records: [], columns, columnInfo: describeColumns(columns, meta) },
            byKey
        );

        expect(sheet.map(c => [c.group, c.header])).toEqual([
            ["identification", "Survey name"],
            ["identification", "Facility name"],
            ["identification", "Unique facility ID (from case report)"],
            ["identification", "Unique ward ID (from case report)"],
            ["identification", "Unique survey patient ID"],
            ["check", "Data check"],
            ["check", "Data check details"],
            // The patient ID and the two link fields are not repeated as questions.
            ["form", "Unique survey patient ID (this form's own field: ___ or ___/C3)"],
            ["form", "Follow-up: Outcome"],
            ["system", "Record ID"],
            ["system", "Survey record ID"],
            ["system", "Facility record ID"],
            ["system", "Ward record ID"],
            ["system", "Case report record ID"],
            ["system", "DHIS2 org unit ID"],
            ["system", "Date entered"],
            ["system", "Last changed"],
            ["system", "Enrolled on"],
            ["system", "Status"],
            ["system", "Form version"],
        ]);
        expect(sheet.find(c => c.header === "Follow-up: Outcome")?.about).toBe(
            "Follow-up. DHIS2 field: Outcome at D28 (de1)."
        );
    });

    it("gives the Survey sheet its name and country, not the SurveyName field again", () => {
        const { survey } = realGraphForms();
        const byKey = new Map([[survey.key, { form: survey, records: [], columns: new Map() }]]);
        const columns = new Map([
            [PREVALENCE_SURVEY_NAME_DATAELEMENT_ID, "SurveyName"],
            ["start", "SurveyStartDate"],
        ]);
        const headers = sheetColumns({ form: survey, records: [], columns }, byKey).map(
            c => c.header
        );

        expect(headers.slice(0, 2)).toEqual(["Survey name", "Country"]);
        expect(headers).not.toContain("SurveyName");
        expect(headers).toContain("SurveyStartDate");
    });

    it("tells apart a form's own copy of an identification field", () => {
        const { followUp, byKey } = followUpGraph();
        const columns = new Map([
            ["other", "Unique survey patient ID"],
            ["facOwn", "Unique facility ID"],
        ]);
        const columnInfo = new Map([
            ["other", { section: "", dhis2Name: "Unique survey patient ID-DF", id: "other" }],
        ]);
        const headers = sheetColumns(
            { form: followUp, records: [], columns, columnInfo },
            byKey
        ).map(c => c.header);

        expect(headers).toContain("Unique survey patient ID (this form's own field)");
        expect(headers.filter(h => h === "Unique survey patient ID")).toHaveLength(1);
        // The form's own facility field, next to the one copied from the case report.
        expect(headers).toContain("Unique facility ID (this form's own field)");
        expect(headers).toContain("Unique facility ID (from case report)");
    });
});

describe("computeColumnCount", () => {
    it("counts every configured field, answered or not, as the written sheet will", () => {
        const { followUp, byKey } = followUpGraph();
        const meta = followUpMeta();

        // 5 identification + 2 data check + 2 questions + 11 DHIS2 linking and system.
        expect(computeColumnCount(followUp, byKey, meta)).toBe(20);
        expect(computeColumnCount(followUp, byKey, meta)).toBe(
            sheetColumns(
                { form: followUp, records: [], columns: configuredColumns(meta, "tracker") },
                byKey
            ).length
        );
    });
});

describe("programsToExtract", () => {
    const defaultCase = form({ key: "CaseReport", uid: "default", defaultUid: "default" });
    const customCase = form({ key: "CaseReport", uid: "custom", defaultUid: "default" });

    it("skips a proven-empty program when another program of the form has data", () => {
        const kept = programsToExtract(
            [defaultCase, customCase],
            new Map([
                ["default", 0],
                ["custom", 12],
            ])
        );
        expect(kept).toEqual([customCase]);
    });

    it("keeps the default program of a form with no data anywhere, so it gets its sheet", () => {
        const kept = programsToExtract(
            [defaultCase, customCase],
            new Map([
                ["default", 0],
                ["custom", 0],
            ])
        );
        expect(kept).toEqual([defaultCase]);
    });

    it("keeps programs whose count is unknown", () => {
        expect(programsToExtract([customCase], new Map())).toEqual([customCase]);
    });
});

describe("forecastWorkbook", () => {
    function discoveryFor(
        overrides: Partial<FormDiscovery> & { form: ResolvedForm }
    ): FormDiscovery {
        return { stages: [], ...overrides };
    }

    it("computes total cells as the sum of rows x columns across main and stage sheets", () => {
        const discoveries: FormDiscovery[] = [
            discoveryFor({
                form: form({ key: "Facility" }),
                total: 40,
                columns: 51,
                stages: [
                    {
                        sheetKey: "Facility__WardData",
                        stageName: "Ward data",
                        parentFormKey: "Facility",
                        rows: 100,
                        columns: 230,
                    },
                ],
            }),
        ];

        const forecast = forecastWorkbook(discoveries);

        expect(forecast.totalCells).toBe(40 * 51 + 100 * 230);
        expect(forecast.sheets).toHaveLength(2);
    });

    it("warns on an unusually wide sheet", () => {
        const discoveries: FormDiscovery[] = [
            discoveryFor({ form: form({ key: "CentralRefLab" }), total: 806, columns: 518 }),
        ];

        const forecast = forecastWorkbook(discoveries);

        expect(forecast.warnings.some(w => w.includes("CentralRefLab"))).toBe(true);
    });

    it("does not warn for a modestly sized sheet", () => {
        const discoveries: FormDiscovery[] = [
            discoveryFor({ form: form({ key: "Facility" }), total: 40, columns: 51 }),
        ];

        expect(forecastWorkbook(discoveries).warnings).toEqual([]);
    });

    it("still gives a form proven to have 0 records its (empty) sheets, as extraction does", () => {
        // DischargeEconomic had total=0: its default program is still extracted (one empty
        // page), so it and its repeatable stage get empty sheets with every column.
        const discoveries: FormDiscovery[] = [
            discoveryFor({
                form: form({ key: "DischargeEconomic" }),
                total: 0,
                columns: 16,
                stages: [
                    {
                        sheetKey: "DischargeEconomic__EconomicEvaluation",
                        stageName: "Economic evaluation",
                        parentFormKey: "DischargeEconomic",
                        rows: 0,
                        columns: 64,
                    },
                ],
            }),
            discoveryFor({ form: form({ key: "Facility" }), total: 40, columns: 51 }),
        ];

        const forecast = forecastWorkbook(discoveries);

        expect(forecast.sheets.map(s => [s.sheetKey, s.rows])).toEqual([
            ["DischargeEconomic", 0],
            ["DischargeEconomic__EconomicEvaluation", 0],
            ["Facility", 40],
        ]);
    });

    it("keeps a repeatable stage with 0 rows: every stage gets its sheet", () => {
        const discoveries: FormDiscovery[] = [
            discoveryFor({
                form: form({ key: "Facility" }),
                total: 40,
                columns: 51,
                stages: [
                    {
                        sheetKey: "Facility__EmptyStage",
                        stageName: "Empty",
                        parentFormKey: "Facility",
                        rows: 0,
                        columns: 10,
                    },
                    {
                        sheetKey: "Facility__WardData",
                        stageName: "Ward data",
                        parentFormKey: "Facility",
                        rows: 5,
                        columns: 230,
                    },
                ],
            }),
        ];

        const forecast = forecastWorkbook(discoveries);

        expect(forecast.sheets.map(s => s.sheetKey)).toEqual([
            "Facility",
            "Facility__EmptyStage",
            "Facility__WardData",
        ]);
    });

    it("leaves cells undefined (not zero) when rows or columns aren't known, rather than under-forecasting", () => {
        const discoveries: FormDiscovery[] = [
            discoveryFor({ form: form({ key: "WardSummaryStats", kind: "dataSet" }) }),
        ];

        const forecast = forecastWorkbook(discoveries);

        expect(forecast.sheets[0]!.cells).toBeUndefined();
        expect(forecast.totalCells).toBe(0);
    });
});

describe("formatBytes", () => {
    it("renders bytes, MB and GB at sensible boundaries", () => {
        expect(formatBytes(500)).toBe("500 B");
        expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
        expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe("2.00 GB");
    });
});

describe("candidateProgramIds", () => {
    const modules = [
        {
            customForms: {
                SURVEY_A: { DEFAULT_CRF: "CUSTOM_CRF", DEFAULT_ECON: "" },
                SURVEY_B: { DEFAULT_CRF: "CUSTOM_CRF" },
            },
        },
        { customForms: { SURVEY_C: { DEFAULT_CRF: "CUSTOM_CRF_V2" } } },
        {},
    ] as unknown as AMRSurveyModule[];

    it("returns the default program followed by every distinct custom variant", () => {
        expect(candidateProgramIds("DEFAULT_CRF", modules)).toEqual([
            "DEFAULT_CRF",
            "CUSTOM_CRF",
            "CUSTOM_CRF_V2",
        ]);
    });

    it("returns just the default when no survey customises it, ignoring empty mappings", () => {
        expect(candidateProgramIds("DEFAULT_ECON", modules)).toEqual(["DEFAULT_ECON"]);
        expect(candidateProgramIds("DEFAULT_OTHER", modules)).toEqual(["DEFAULT_OTHER"]);
    });
});

describe("mergeByFormKey", () => {
    const defaultProgram = form({ key: "CaseReport", uid: "DEF", serverName: "Case report form" });
    const customProgram = form({
        key: "CaseReport",
        uid: "CUS",
        serverName: "Case report form - custom v1",
        isCustom: true,
        parentLinkField: "LINK",
    });

    it("stacks the programs' rows into one sheet and unions the columns, default first", () => {
        const merged = mergeByFormKey([
            {
                form: defaultProgram,
                records: [record({ id: "A" })],
                columns: new Map([
                    ["a", "Age"],
                    ["b", "Sex"],
                ]),
                valueTypes: new Map([["a", "INTEGER"]]),
            },
            { form: form({ key: "Survey" }), records: [record({ id: "S" })], columns: new Map() },
            {
                form: customProgram,
                records: [record({ id: "B" })],
                columns: new Map([
                    ["b", "Sex (renamed)"],
                    ["c", "Ward"],
                ]),
                valueTypes: new Map([["c", "TEXT"]]),
            },
        ]);

        expect(merged.map(d => d.form.key)).toEqual(["CaseReport", "Survey"]);
        const crf = merged[0]!;
        expect(crf.records.map(r => r.id)).toEqual(["A", "B"]);
        expect([...crf.columns.entries()]).toEqual([
            ["a", "Age"],
            ["b", "Sex"],
            ["c", "Ward"],
        ]);
        expect([...crf.valueTypes!.keys()]).toEqual(["a", "c"]);
        expect(crf.form.serverName).toBe("Case report form; Case report form - custom v1");
        expect(crf.form.uid).toBe("DEF; CUS");
        expect(crf.form.isCustom).toBe(true);
    });

    it("leaves a form backed by one program untouched", () => {
        const only = {
            form: defaultProgram,
            records: [record({ id: "A" })],
            columns: new Map([["a", "Age"]]),
        };
        expect(mergeByFormKey([only])).toEqual([only]);
    });
});

describe("expectedRecordCounts", () => {
    const def = form({ key: "CaseReport", uid: "DEF" });
    const custom = form({ key: "CaseReport", uid: "CUS", isCustom: true });
    const survey = form({ key: "Survey", uid: "SUR" });

    it("sums the discovered totals of a form's extracted programs", () => {
        const totals = new Map([
            ["DEF", 4475],
            ["CUS", 12],
            ["SUR", 4],
        ]);
        expect(expectedRecordCounts([def, custom, survey], totals)).toEqual(
            new Map([
                ["CaseReport", 4487],
                ["Survey", 4],
            ])
        );
    });

    it("leaves a form out when any of its programs has no known total", () => {
        const totals = new Map<string, number | undefined>([
            ["DEF", 10],
            ["CUS", undefined],
        ]);
        expect(expectedRecordCounts([def, custom], totals).has("CaseReport")).toBe(false);
    });

    it("adds the probed rows of repeatable-stage sheets, summed across programs", () => {
        const stageOf = (form: ResolvedForm, rows: number) => ({
            form,
            total: 1,
            stages: [
                {
                    sheetKey: "CaseReport__Ward",
                    stageName: "Ward",
                    parentFormKey: "CaseReport",
                    rows,
                    columns: 9,
                },
            ],
        });
        const notExtracted = form({ key: "Other", uid: "OTH" });

        const expected = expectedRecordCounts(
            [def, custom],
            new Map([
                ["DEF", 1],
                ["CUS", 1],
            ]),
            [stageOf(def, 223), stageOf(custom, 5), stageOf(notExtracted, 99)]
        );

        expect(expected.get("CaseReport__Ward")).toBe(228);
    });
});

describe("toCellValue", () => {
    it("turns numeric value types into numbers", () => {
        expect(toCellValue("42", "INTEGER")).toBe(42);
        expect(toCellValue("3.5", "NUMBER")).toBe(3.5);
    });

    it("keeps text, codes and unparseable values unchanged", () => {
        expect(toCellValue("007", "TEXT")).toBe("007");
        expect(toCellValue("007", undefined)).toBe("007");
        expect(toCellValue("n/a", "INTEGER")).toBe("n/a");
        expect(toCellValue("", "INTEGER")).toBe("");
    });

    it("turns dates into the same calendar date, whatever the local time zone", () => {
        expect(toCellValue("2024-05-22", "DATE")).toEqual(new Date("2024-05-22T00:00:00Z"));
        expect(toCellValue("2024-05-22T10:11:12.000", "DATETIME")).toEqual(
            new Date("2024-05-22T10:11:12Z")
        );
        expect(toCellValue("not a date", "DATE")).toBe("not a date");
    });
});

describe("buildTrackerRecords: option names and the program column", () => {
    const meta = programMeta({
        stages: [
            stage({ id: "S1", name: "Stage", dataElementLabels: new Map([["ast", "AST result"]]) }),
        ],
        attributes: new Map([["attr", "Specimen"]]),
        optionNames: new Map([
            ["ast", new Map([["I", "Intermediate"]])],
            ["attr", new Map([["BLD", "Blood"]])],
        ]),
    });

    it("writes option names for option-set fields and leaves other values alone", () => {
        const { main } = buildTrackerRecords(
            {
                trackedEntity: "T1",
                attributes: [{ attribute: "attr", value: "BLD" }],
                events: [
                    {
                        event: "E1",
                        programStage: "S1",
                        dataValues: [
                            { dataElement: "ast", value: "I" },
                            { dataElement: "free", value: "I" },
                        ],
                    },
                ],
            },
            form({ key: "CentralRefLab" }),
            meta,
            new Map(),
            new Map()
        );

        expect(main.values.get("attr")).toBe("Blood");
        expect(main.values.get("stage:ast")).toBe("Intermediate");
        expect(main.values.get("stage:free")).toBe("I");
    });

    it("keeps the stored code when the option is not in the set", () => {
        const { main } = buildTrackerRecords(
            { trackedEntity: "T1", attributes: [{ attribute: "attr", value: "UNKNOWN" }] },
            form({ key: "CentralRefLab" }),
            meta,
            new Map(),
            new Map()
        );
        expect(main.values.get("attr")).toBe("UNKNOWN");
    });

    it("stamps each row with the program it came from", () => {
        const { main } = buildTrackerRecords(
            { trackedEntity: "T1" },
            form({ key: "CaseReport", serverName: "Case report form - custom v1" }),
            meta,
            new Map(),
            new Map()
        );
        expect(main.meta.get("program")).toBe("Case report form - custom v1");
    });
});

describe("buildTrackerRecords: second event on a single-entry stage", () => {
    const meta = programMeta({ stages: [stage({ id: "S1", name: "Species 1" })] });
    const event = (id: string, value?: string) => ({
        event: id,
        programStage: "S1",
        dataValues: value ? [{ dataElement: "de", value }] : [],
    });

    it("counts a second event with data, since its values overwrite the first's", () => {
        const report = emptyIntegrityReport();
        const { main } = buildTrackerRecords(
            { trackedEntity: "T1", events: [event("E1", "first"), event("E2", "second")] },
            form({ key: "CentralRefLab" }),
            meta,
            new Map(),
            new Map(),
            report
        );

        expect(report.duplicateStageEvents).toEqual([
            { formKey: "CentralRefLab", programStage: "S1", count: 1 },
        ]);
        expect(main.values.get("stage:de")).toBe("second");
    });

    it("does not count an empty second event, which loses nothing", () => {
        const report = emptyIntegrityReport();
        buildTrackerRecords(
            { trackedEntity: "T1", events: [event("E1", "first"), event("E2")] },
            form({ key: "CentralRefLab" }),
            meta,
            new Map(),
            new Map(),
            report
        );

        expect(report.duplicateStageEvents).toEqual([]);
    });
});

describe("makePageGuard", () => {
    const id = (item: { id: string }) => item.id;

    it("drops records already seen on an earlier page", () => {
        const fresh = makePageGuard("F");
        expect(fresh([{ id: "a" }, { id: "b" }], id)).toEqual([{ id: "a" }, { id: "b" }]);
        expect(fresh([{ id: "b" }, { id: "c" }], id)).toEqual([{ id: "c" }]);
    });

    it("signals a stop when a page adds nothing new, but not for an empty page", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const fresh = makePageGuard("F");
        fresh([{ id: "a" }], id);

        expect(fresh([{ id: "a" }], id)).toBeUndefined();
        expect(fresh([], id)).toEqual([]);
        warn.mockRestore();
    });
});

describe("mapWithConcurrency", () => {
    it("keeps input order and never exceeds the limit", async () => {
        let inFlight = 0;
        let peak = 0;
        const delays = [30, 5, 5, 5, 5, 5];

        const results = await mapWithConcurrency(delays, 3, async ms => {
            inFlight++;
            peak = Math.max(peak, inFlight);
            await new Promise(resolve => setTimeout(resolve, ms));
            inFlight--;
            return ms * 2;
        });

        expect(results).toEqual([60, 10, 10, 10, 10, 10]);
        expect(peak).toBe(3);
    });

    it("lets a slow item hold up one slot, not the whole batch", async () => {
        const log: string[] = [];
        const items = [
            { id: "slow", ms: 40 },
            { id: "a", ms: 1 },
            { id: "b", ms: 1 },
        ];

        await mapWithConcurrency(items, 2, async ({ id, ms }) => {
            log.push(`start:${id}`);
            await new Promise(resolve => setTimeout(resolve, ms));
            log.push(`end:${id}`);
        });

        // Fixed batches of 2 would not start "b" until "slow" had finished.
        expect(log.indexOf("start:b")).toBeLessThan(log.indexOf("end:slow"));
    });

    it("stops starting new items after a failure", async () => {
        const started: number[] = [];
        await expect(
            mapWithConcurrency([1, 2, 3, 4, 5], 1, async n => {
                started.push(n);
                if (n === 2) throw new Error("boom");
            })
        ).rejects.toThrow("boom");

        expect(started).toEqual([1, 2]);
    });
});
