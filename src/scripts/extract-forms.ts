/**
 * Read-only extraction of AMR Surveys form data into a single Excel workbook.
 *
 * This script issues GET requests only. It never posts, updates or deletes.
 *
 * Form UIDs are resolved from live server metadata by name, because "custom"
 * forms are configured per parent survey in the DHIS2 datastore
 * (amr-surveys/modules) and therefore do not exist as constants in this repo.
 * The constants in data/entities/D2Survey.ts are used only as a cross-check.
 *
 * A form is defined by its DEFAULT program. A survey may swap in a custom variant (datastore
 * amr-surveys/modules .customForms), so a country's data lives in whichever of the default
 * and custom programs it used. Every candidate program is probed under the requested scope;
 * those with data are extracted and stacked into one sheet per form (see mergeByFormKey).
 *
 * Usage:
 *   yarn extract-forms --dry-run
 *   yarn extract-forms --country KEN                 one workbook for one country
 *   yarn extract-forms --per-country                 one workbook per country that has data
 *   yarn extract-forms                               everything the user can read, one workbook
 *   yarn extract-forms --country KEN --start-date 2024-01-01 --end-date 2024-12-31
 *
 * --start-date/--end-date only affect the Ward Summary Statistics dataSet (default: all time).
 */
import { command, run, string, boolean, flag, option, optional, number } from "cmd-ts";
import Excel from "exceljs";
import fs from "fs";
import path from "path";

import { D2Api } from "../types/d2-api";
import {
    createSessionManager,
    describeAuth,
    deriveEnvLabel,
    getD2APiFromInstance,
    getEnvVars,
    getInstance,
    warmUpSession,
    type SessionManager,
} from "./common";
import { AMRSurveyModule } from "../domain/entities/AMRSurveyModule";
import { getParentDataElementForProgram } from "../data/utils/surveyProgramHelper";
import {
    AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_COH,
    AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_DEC,
    AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_DF,
    AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_FUP,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL,
    AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF,
    AMR_SURVEYS_PREVALENCE_TEA_HOSPITAL_ID,
    AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID,
    SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID,
    PREVALENCE_CASE_REPORT_FORM_ID,
    PREVALENCE_CENTRAL_REF_LAB_FORM_ID,
    PREVALENCE_FACILITY_LEVEL_FORM_ID,
    PREVALENCE_MORTALITY_COHORT_ENORL_FORM,
    PREVALENCE_MORTALITY_DISCHARGE_CLINICAL_FORM,
    PREVALENCE_MORTALITY_DISCHARGE_ECONOMIC_FORM,
    PREVALENCE_MORTALITY_FOLLOWUP_FORM,
    PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID,
    PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID,
    PREVALENCE_SUPRANATIONAL_REF_LAB_ID,
    PREVALENCE_SURVEY_FORM_ID,
    PREVALENCE_SURVEY_NAME_DATAELEMENT_ID,
    WARD_STATISTICS_WARD_LEVEL_FORM_ID,
    WARD_SUMMARY_STATISTICS_FORM_ID,
} from "../data/entities/D2Survey";

// --- Registry of the forms to extract -----------------------------------------

// "trackerStage" is synthetic: a repeatable program stage on a tracker program, split
// into its own sheet because a TEI can have many events per repeatable stage (a
// different cardinality than the flat, one-row-per-TEI model everything else uses).
type FormKind = "tracker" | "event" | "dataSet" | "trackerStage";

type FormSpec = {
    /** Short stable key: --forms takes it, and it identifies the sheet internally. */
    key: string;
    /** What readers see: the sheet name, and "<title> record ID" headers. */
    title: string;
    /** Name as it appears on the DHIS2 server. Display only; resolution is by UID. */
    requestedName: string;
    /**
     * UID of the default program (or dataSet) from D2Survey.ts. The form is identified by
     * this; its custom variants are read from the datastore (see candidateProgramIds).
     */
    defaultUid: string;
    /** Key of the parent form in this registry, if any. */
    parentKey?: string;
    /** Forced kind; otherwise derived from server metadata. */
    kind?: FormKind;
};

const FORMS: FormSpec[] = [
    {
        key: "Survey",
        title: "Survey",
        requestedName: "Survey form",
        defaultUid: PREVALENCE_SURVEY_FORM_ID,
    },
    {
        key: "Facility",
        title: "Facility",
        requestedName: "Facility-level form",
        defaultUid: PREVALENCE_FACILITY_LEVEL_FORM_ID,
        parentKey: "Survey",
    },
    {
        // Parent is Survey, NOT Facility — see the note on PARENT_BY_DEFAULT_UID.
        key: "CaseReport",
        title: "Case report",
        requestedName: "Case report form - custom v1",
        defaultUid: PREVALENCE_CASE_REPORT_FORM_ID,
        parentKey: "Survey",
    },
    {
        key: "SampleShipment",
        title: "Sample shipment",
        requestedName: "Sample shipment and tracking form - custom v1",
        defaultUid: PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID,
        parentKey: "CaseReport",
    },
    {
        key: "CentralRefLab",
        title: "Central ref lab",
        requestedName: "Central reference laboratory ID/AST results form",
        defaultUid: PREVALENCE_CENTRAL_REF_LAB_FORM_ID,
        parentKey: "CaseReport",
    },
    {
        key: "PathogenIsolates",
        title: "Pathogen isolates",
        requestedName: "Pathogen Isolates storage and tracking log",
        defaultUid: PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID,
        parentKey: "CaseReport",
    },
    {
        key: "Supranational",
        title: "Supranational ref lab",
        requestedName: "Supranational Reference Laboratory ID/AST results form",
        defaultUid: PREVALENCE_SUPRANATIONAL_REF_LAB_ID,
        parentKey: "CaseReport",
    },
    {
        key: "FollowUpD28",
        title: "Follow-up D28",
        requestedName: "Follow-up form D28 - custom v1",
        defaultUid: PREVALENCE_MORTALITY_FOLLOWUP_FORM,
        parentKey: "CaseReport",
    },
    {
        key: "DischargeClinical",
        title: "Discharge clinical",
        requestedName: "Discharge form - Clinical Evaluation",
        defaultUid: PREVALENCE_MORTALITY_DISCHARGE_CLINICAL_FORM,
        parentKey: "CaseReport",
    },
    {
        key: "DischargeEconomic",
        title: "Discharge economic",
        requestedName: "Discharge form - Economical Evaluation",
        defaultUid: PREVALENCE_MORTALITY_DISCHARGE_ECONOMIC_FORM,
        parentKey: "CaseReport",
    },
    {
        key: "CohortEnrolment",
        title: "Cohort enrolment",
        requestedName: "Cohort 3 enrolment form - custom v1",
        defaultUid: PREVALENCE_MORTALITY_COHORT_ENORL_FORM,
        parentKey: "CaseReport",
    },
    {
        // Ward x specialty. Its successor below holds ward-level values; both are live.
        key: "WardSummaryStats",
        title: "Ward summary statistics",
        requestedName: "Ward Summary Statistics",
        defaultUid: WARD_SUMMARY_STATISTICS_FORM_ID,
        kind: "dataSet",
    },
    {
        key: "WardLevelStats",
        title: "Ward level statistics",
        requestedName: "Ward Statistics for Ward",
        defaultUid: WARD_STATISTICS_WARD_LEVEL_FORM_ID,
        kind: "dataSet",
    },
];

// --- Types --------------------------------------------------------------------

/**
 * ONE program (or dataSet) backing a form. A form with a custom variant resolves to several
 * of these sharing a `key`: the default program plus each custom program.
 */
export type ResolvedForm = FormSpec & {
    uid: string;
    serverName: string;
    kind: FormKind;
    /** True when `uid` is a custom variant of the default program, not the default itself. */
    isCustom: boolean;
    /** Attribute/data element UID on this form holding the parent's id. */
    parentLinkField: string;
    /** Attribute UID on this form holding the *root Survey* id ("" if none). */
    surveyLinkField: string;
};

/** One extracted record, normalised across tracker/event/dataSet. */
export type Record_ = {
    id: string;
    parentId: string;
    /** Root Survey id, read directly from this record's own survey-link attribute. */
    surveyId: string;
    /** Facility record id, derived from (surveyId, orgUnit) — not a stored FK. */
    facilityId: string;
    orgUnit: string;
    values: Map<string, string>;
    meta: Map<string, string>;
    /** Data-quality flags, shown first on the row so epidemiologists see them (see flagRecords). */
    flags: RecordFlag[];
    /** The readable codes shown first on every sheet (see resolveReadableCodes). */
    codes?: ReadableCodes;
    /** Ward-data record of the patient's ward, derived like facilityId (see resolveReadableCodes). */
    wardId?: string;
    /** Ward statistics rows only: the bare ward name ("W16") from the dataSet's ward category. */
    wardName?: string;
};

/**
 * The codes survey teams type, as opposed to DHIS2 record ids. They nest: patient
 * HF025/W16/011 is in ward HF025/W16, in facility HF025 (verified on prod, Oct 2026).
 * Trimmed; "" where a sheet has no such code.
 */
export type ReadableCodes = { survey: string; facility: string; ward: string; patient: string };

const NO_CODES: ReadableCodes = { survey: "", facility: "", ward: "", patient: "" };

// Where the readable codes are typed. Only this script reads them, so they are kept here
// rather than in D2Survey.ts.
const CASE_REPORT_FACILITY_CODE_TEA = "qgPNgq0Ws7k"; // "Unique facility ID"
const CASE_REPORT_WARD_CODE_TEA = "KoKmhwZGJnW"; // "Unique ward/department ID"
const FACILITY_WARD_CODE_DATAELEMENT_ID = "yAA33dsnWmY"; // Facility form, "Ward data" stage
const WARD_ID_CATEGORY_ID = "ROJT9Xpehsv"; // "Ward ID", the ward category of both ward dataSets

/**
 * The follow-up, discharge and cohort forms carry a second patient ID field of their own,
 * next to the shared "Unique survey patient ID". It holds the patient ID or, for cohort 3,
 * the patient ID + "/C3" (Malawi on preprod, Oct 2026: about 330 and 250 follow-ups). The
 * cohort form labels it "Unique survey patient ID (___/C3)"; the follow-up and discharge
 * forms label it exactly like the shared field, so the extract renames those two.
 */
const OWN_PATIENT_ID_TEAS = new Set(["qsDC1eNnbgE", "Cw0y6iIZ4nb", "GuAjeIwxA6f"]);
const UNLABELLED_OWN_PATIENT_ID_TEAS = new Set(["qsDC1eNnbgE", "Cw0y6iIZ4nb"]);
const OWN_PATIENT_ID_LABEL = "Unique survey patient ID (this form's own field: ___ or ___/C3)";

/** A field's form label, except where the form's label hides what the field is. */
function fieldLabel(field: { id: string; name: string; formName?: string }): string {
    if (UNLABELLED_OWN_PATIENT_ID_TEAS.has(field.id)) return OWN_PATIENT_ID_LABEL;
    return field.formName || field.name;
}

export type FlagKind =
    | "TEST/INVALID"
    | "PARENT DELETED"
    | "PARENT MISSING"
    | "OUTSIDE EXTRACT"
    | "SURVEY MISMATCH"
    | "PARENT FLAGGED"
    | "ID MISMATCH";

export type RecordFlag = { flag: FlagKind; detail: string };

/** What each flag means, for the _index legend. */
export const FLAG_MEANINGS: Record<FlagKind, string> = {
    "TEST/INVALID":
        "The record's Survey record ID is missing or is not a survey in DHIS2: almost always test data.",
    "PARENT DELETED":
        "The record it belongs to (its case report or survey) was deleted in DHIS2; this record was not.",
    "PARENT MISSING": "The record it belongs to does not exist in DHIS2 (or no link was recorded).",
    "OUTSIDE EXTRACT":
        "The record it belongs to exists in DHIS2 but under another org unit, outside this extract.",
    "SURVEY MISMATCH": "Its own Survey record ID differs from that of the record it belongs to.",
    "PARENT FLAGGED": "The record it belongs to is itself flagged; see that record's flag.",
    "ID MISMATCH":
        "The facility, ward or patient codes typed on it disagree with each other or with the " +
        "record it belongs to, ignoring case, spaces, leading zeros, a trailing slash and Cyrillic look-alike letters (see Data check details). The " +
        "DHIS2 links (*_id columns) are not affected.",
};

export type FormData = {
    form: ResolvedForm;
    records: Record_[];
    /** Ordered value column UIDs -> display label. */
    columns: Map<string, string>;
    /** Value column UID -> DHIS2 valueType; absent means the column is written as text. */
    valueTypes?: Map<string, string>;
    /** Value column UID -> where it comes from, for header notes and the Column guide. */
    columnInfo?: Map<string, ColumnInfo>;
};

/** Where a form column comes from. */
export type ColumnInfo = {
    /** The form section (or stage) it sits in. */
    section: string;
    /** The field's DHIS2 name and id, e.g. "Unique survey patient ID-Fup" (qsDC1eNnbgE). */
    dhis2Name: string;
    id: string;
};

const EXCEL_MAX_ROWS = 1_048_576;

// The workbook's own sheets, before the form sheets. Form sheets can never take these names.
const READ_ME_SHEET = "Read me";
const COLUMN_GUIDE_SHEET = "Column guide";
const JOINS_SHEET = "Joins (technical)";

/** Matches glass-dev's bulkDownloadAMUFiles.ts, which this server tolerates well. */
const FETCH_CONCURRENCY = 6;

/** Programs being extracted at once. Their page requests share REQUEST_CONCURRENCY below. */
const EXTRACT_CONCURRENCY = 3;

/**
 * Full-page data requests in flight across the whole run. A page carries every attribute,
 * event and value of up to --page-size records, far heavier than a discovery probe, so this
 * one shared cap is what keeps the load on DHIS2 bounded however pages and programs overlap.
 */
const REQUEST_CONCURRENCY = 4;

export type Limiter = <T>(task: () => Promise<T>) => Promise<T>;

/**
 * At most `limit` tasks run at once; the rest wait their turn in FIFO order. A finishing
 * task hands its slot straight to the next waiter, so the limit is never overshot.
 */
export function createLimiter(limit: number): Limiter {
    let active = 0;
    const waiting: (() => void)[] = [];

    return async task => {
        if (active < limit) active++;
        else await new Promise<void>(resolve => waiting.push(resolve));
        try {
            return await task();
        } finally {
            const next = waiting.shift();
            if (next) next();
            else active--;
        }
    };
}

/**
 * Runs `fn` over `items` with at most `limit` in flight, preserving input order in the
 * result. A pool, not fixed batches: a slow item holds up one slot, never the whole batch.
 * Bounded so a wide list can't open dozens of parallel requests against DHIS2 at once.
 * After a failure no further items are started.
 */
export async function mapWithConcurrency<T, R>(
    items: readonly T[],
    limit: number,
    fn: (item: T) => Promise<R>
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let next = 0;

    const worker = async () => {
        while (next < items.length) {
            const index = next++;
            try {
                results[index] = await fn(items[index] as T);
            } catch (err) {
                next = items.length;
                throw err;
            }
        }
    };

    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
}

/**
 * Parent form by *default* UID. Keyed by default UID so custom forms resolve to the
 * same parent as the default they override.
 *
 * IMPORTANT — this mirrors what the app actually filters on, which is NOT the visual
 * nesting of the UI. GetPaginatedSurveysUseCase.ts:49 does:
 *
 *   const parentId = isPrevalencePatientChild(type) ? parentPatientId : parentSurveyId;
 *
 * and isPrevalencePatientChild (PPSProgramsHelper.ts:239) covers only the 8 leaf forms.
 * So Facility AND Case report are both filtered by the *root Survey id*: Case report's
 * tlRPoWumrSa holds a Survey id, not a Facility id. Case report has no foreign key to
 * Facility at all — the UI scopes it by orgUnit (useSurveys.ts:100). Facility linkage is
 * therefore derived from (Survey_id, org_unit_id); see resolveFacilityIds().
 */
const PARENT_BY_DEFAULT_UID: Record<string, string> = {
    [PREVALENCE_FACILITY_LEVEL_FORM_ID]: PREVALENCE_SURVEY_FORM_ID,
    [PREVALENCE_CASE_REPORT_FORM_ID]: PREVALENCE_SURVEY_FORM_ID,
    [PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID]: PREVALENCE_CASE_REPORT_FORM_ID,
    [PREVALENCE_CENTRAL_REF_LAB_FORM_ID]: PREVALENCE_CASE_REPORT_FORM_ID,
    [PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID]: PREVALENCE_CASE_REPORT_FORM_ID,
    [PREVALENCE_SUPRANATIONAL_REF_LAB_ID]: PREVALENCE_CASE_REPORT_FORM_ID,
    [PREVALENCE_MORTALITY_FOLLOWUP_FORM]: PREVALENCE_CASE_REPORT_FORM_ID,
    [PREVALENCE_MORTALITY_DISCHARGE_CLINICAL_FORM]: PREVALENCE_CASE_REPORT_FORM_ID,
    [PREVALENCE_MORTALITY_DISCHARGE_ECONOMIC_FORM]: PREVALENCE_CASE_REPORT_FORM_ID,
    [PREVALENCE_MORTALITY_COHORT_ENORL_FORM]: PREVALENCE_CASE_REPORT_FORM_ID,
};

/**
 * The TEA on each form that holds the *root Survey* id, by default UID. Every leaf form
 * carries one of these in addition to its patient link (see parentPrevalenceSurveyIdList,
 * D2Survey.ts:143), so every record can be traced to its Survey directly, without walking
 * the chain — and the walked chain can be cross-checked against it.
 */
const SURVEY_LINK_BY_DEFAULT_UID: Record<string, string> = {
    [PREVALENCE_FACILITY_LEVEL_FORM_ID]: SURVEY_ID_FACILITY_LEVEL_DATAELEMENT_ID,
    [PREVALENCE_CASE_REPORT_FORM_ID]: AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRF,
    [PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID]: AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SSTF,
    [PREVALENCE_CENTRAL_REF_LAB_FORM_ID]: AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_CRL,
    [PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID]: AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_PIS,
    [PREVALENCE_SUPRANATIONAL_REF_LAB_ID]: AMR_SURVEYS_PREVALENCE_TEA_SURVEY_ID_SRL,
    [PREVALENCE_MORTALITY_FOLLOWUP_FORM]: AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_FUP,
    [PREVALENCE_MORTALITY_DISCHARGE_CLINICAL_FORM]: AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_DF,
    [PREVALENCE_MORTALITY_DISCHARGE_ECONOMIC_FORM]: AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_DEC,
    [PREVALENCE_MORTALITY_COHORT_ENORL_FORM]: AMR_SURVEYS_MORTALITY_TEA_SURVEY_ID_COH,
};

// --- Connection ---------------------------------------------------------------

// Connection/auth is handled by ./common.ts, a port of the glass-dev script auth
// layer (PAT support, backend:"fetch", session warm-up, refresh + backoff).

// --- Resolution ---------------------------------------------------------------

/**
 * Fatal on failure: the datastore is what says which custom programs exist and which field
 * links a record to its parent, so carrying on without it would silently drop whole programs.
 */
async function fetchModules(api: D2Api, session: SessionManager): Promise<AMRSurveyModule[]> {
    try {
        const modules = await session.retryWithBackoff(() =>
            api.get<AMRSurveyModule[]>("/dataStore/amr-surveys/modules").getData()
        );
        if (!Array.isArray(modules)) throw new Error("unexpected content");
        return modules;
    } catch (err) {
        throw new Error(
            `Could not read datastore amr-surveys/modules (${
                err instanceof Error ? err.message : err
            }); ` + `custom forms and parent links cannot be resolved without it.`
        );
    }
}

/** The default program plus every custom variant any survey configures for it. */
export function candidateProgramIds(defaultUid: string, modules: AMRSurveyModule[]): string[] {
    const customs = modules
        .flatMap(module => Object.values(module.customForms ?? {}))
        .map(forms => forms[defaultUid])
        .filter((uid): uid is string => !!uid);
    return [...new Set([defaultUid, ...customs])];
}

async function resolveForms(
    api: D2Api,
    session: SessionManager,
    modules: AMRSurveyModule[],
    wanted: FormSpec[]
): Promise<{ resolved: ResolvedForm[]; unresolved: { spec: FormSpec; reason: string }[] }> {
    const { programs, dataSets } = await session.retryWithBackoff(() =>
        api.metadata
            .get({
                programs: { fields: { id: true, name: true, programType: true } },
                dataSets: { fields: { id: true, name: true } },
            })
            .getData()
    );

    const onServer = new Map<string, { name: string; kind: FormKind }>();
    for (const p of programs) {
        onServer.set(p.id, {
            name: p.name,
            kind: p.programType === "WITH_REGISTRATION" ? "tracker" : "event",
        });
    }
    for (const d of dataSets) onServer.set(d.id, { name: d.name, kind: "dataSet" });

    const resolved: ResolvedForm[] = [];
    const unresolved: { spec: FormSpec; reason: string }[] = [];

    for (const spec of wanted) {
        const matches = candidateProgramIds(spec.defaultUid, modules).flatMap(uid => {
            const found = onServer.get(uid);
            return found ? [{ uid, ...found }] : [];
        });

        if (matches.length === 0) {
            unresolved.push({
                spec,
                reason: `no program or dataSet with default UID ${spec.defaultUid} on this server`,
            });
            continue;
        }

        for (const match of matches) {
            resolved.push({
                ...spec,
                uid: match.uid,
                serverName: match.name,
                kind: spec.kind ?? match.kind,
                isCustom: match.uid !== spec.defaultUid,
                parentLinkField:
                    match.kind === "dataSet"
                        ? ""
                        : getParentDataElementForProgram(match.uid, modules),
                surveyLinkField: SURVEY_LINK_BY_DEFAULT_UID[spec.defaultUid] ?? "",
            });
        }
    }

    return { resolved, unresolved };
}

/** Re-derive parentKey from the resolved default UIDs, so custom forms slot in correctly. */
export function linkParents(resolved: ResolvedForm[]): void {
    const byDefaultUid = new Map(resolved.map(f => [f.defaultUid, f.key]));

    for (const form of resolved) {
        const parentDefaultUid = PARENT_BY_DEFAULT_UID[form.defaultUid];
        const derived = parentDefaultUid ? byDefaultUid.get(parentDefaultUid) : undefined;
        if (derived && derived !== form.parentKey) {
            console.warn(
                `  ! ${form.key}: parent corrected from '${form.parentKey}' to '${derived}' via datastore mapping`
            );
            form.parentKey = derived;
        }
    }
}

function reportResolution(
    resolved: ResolvedForm[],
    unresolved: { spec: FormSpec; reason: string }[]
) {
    console.log("\nResolved forms:");
    console.log(
        "  " +
            ["KEY".padEnd(18), "UID".padEnd(13), "KIND".padEnd(8), "CUSTOM".padEnd(7), "NAME"].join(
                ""
            )
    );
    for (const f of resolved) {
        console.log(
            "  " +
                [
                    f.key.padEnd(18),
                    f.uid.padEnd(13),
                    f.kind.padEnd(8),
                    (f.isCustom ? "yes" : "no").padEnd(7),
                    f.serverName,
                ].join("")
        );
        if (f.kind !== "dataSet" && !f.parentLinkField && f.parentKey) {
            console.warn(
                `      ! no parent link field known for ${f.key}; rows will have an empty ${f.parentKey}_id`
            );
        }
    }

    if (unresolved.length > 0) {
        console.log("\nUnresolved forms:");
        for (const { spec, reason } of unresolved) {
            console.log(`  ${spec.key.padEnd(18)} "${spec.requestedName}" -> ${reason}`);
        }
    }
}

// --- Metadata for column labels ------------------------------------------------

export type ProgramStageMeta = {
    id: string;
    name: string;
    repeatable: boolean;
    /** Position of this stage within its program. */
    sortOrder: number;
    /** dataElement id -> display label, plain (not prefixed with the stage/section name). */
    dataElementLabels: Map<string, string>;
    /**
     * dataElement id -> its position in the form (programStageDataElements.sortOrder).
     * Without this, columns land in the order values happen to be encountered while paging,
     * which scatters fields that belong together — e.g. an antibiotic and its own AST
     * result ending up nine columns apart on the Central Ref Lab sheet.
     */
    dataElementOrder: Map<string, number>;
    /**
     * dataElement id -> the form section it sits in, where the stage defines sections.
     * These carry the form's own slot names ("S1 - Antibiotic 1"), which is what makes
     * otherwise-identical labels like "Specify the antibiotic" tellable apart.
     */
    dataElementSection: Map<string, string>;
};

export type ProgramMeta = {
    attributes: Map<string, string>;
    /** attribute id -> its position in the program, so attribute columns keep form order. */
    attributeOrder: Map<string, number>;
    stageById: Map<string, ProgramStageMeta>;
    /** dataElement/attribute id -> DHIS2 valueType; decides numeric and date cells. */
    valueTypes: Map<string, string>;
    /** dataElement/attribute id -> (option code -> option name), for option-set fields. */
    optionNames: Map<string, Map<string, string>>;
    /** dataElement/attribute id -> its DHIS2 name, which, unlike a form label, is unique. */
    fieldNames: Map<string, string>;
};

/** The option's name where the field is option-backed, else the stored value unchanged. */
function displayValue(meta: ProgramMeta, fieldId: string, value: string): string {
    return meta.optionNames.get(fieldId)?.get(value) ?? value;
}

/**
 * A field that holds values but is not on the current form: a data element since removed
 * from its stage (verified live: thousands of historical values on the case report form) or
 * an attribute no longer on the program. Its values are kept. Its column is labelled with
 * the field's full DHIS2 name, which, unlike the form text ("Route"), says which slot it was
 * ("Route1.1YES"), and is marked so nobody mistakes it for a current question.
 */
export type OffFormField = {
    kind: "dataElement" | "trackedEntityAttribute";
    id: string;
    /** Column sort position: just after the fields of the stage it was recorded on. */
    position: number;
    /** Label prefix ("Stage name: ") for main-sheet stage columns, else "". */
    prefix: string;
    /** Values seen, for the _index listing. */
    values: number;
    /** Known once its metadata is fetched (see labelOffFormFields). */
    valueType?: string;
};

/** Sheet ("" = the main sheet, else a repeatable stage id) -> column key -> off-form field. */
export type OffFormTracker = Map<string, Map<string, OffFormField>>;

const OFF_FORM_MARK = "[not on current form]";

/** Counts one value of an off-form column, registering the column on first sight. */
function noteOffForm(
    tracker: OffFormTracker | undefined,
    sheet: string,
    columnKey: string,
    field: Omit<OffFormField, "values">
): void {
    if (!tracker) return;
    let fields = tracker.get(sheet);
    if (!fields) tracker.set(sheet, (fields = new Map()));
    const known = fields.get(columnKey);
    if (known) known.values++;
    else fields.set(columnKey, { ...field, values: 1 });
}

/**
 * Program metadata is needed twice per form — once by discovery (to predict column counts
 * and find repeatable stages) and again by extraction (to label columns). These payloads
 * are large (one program here has ~500 data elements), so the result is memoised per run;
 * a run only ever fetches each program's metadata once.
 */
const programMetaCache = new Map<string, Promise<ProgramMeta>>();

function fetchProgramMeta(
    api: D2Api,
    session: SessionManager,
    programId: string
): Promise<ProgramMeta> {
    const cached = programMetaCache.get(programId);
    if (cached) return cached;
    // Evict on failure, so a failure that outlasts the retries doesn't poison every later
    // caller with the same rejected promise.
    const pending = session
        .retryWithBackoff(() => fetchProgramMetaUncached(api, programId))
        .catch(err => {
            programMetaCache.delete(programId);
            throw err;
        });
    programMetaCache.set(programId, pending);
    return pending;
}

type D2ProgramStage = {
    id: string;
    name: string;
    repeatable?: boolean;
    sortOrder?: number;
    programStageDataElements?: {
        sortOrder?: number;
        dataElement: { id: string; name: string; formName?: string };
    }[];
    programStageSections?: { name: string; sortOrder?: number; dataElements?: { id: string }[] }[];
};

type ProgramField = {
    id: string;
    name: string;
    formName?: string;
    valueType?: string;
    optionSet?: { id: string };
};

async function fetchProgramMetaUncached(api: D2Api, programId: string): Promise<ProgramMeta> {
    // Two calls, because /programs/{id}/metadata.json does not reliably honour a nested
    // field selector for programStages (verified: it returns stage dataElement ids but
    // drops their names, sortOrder and sections). /programStages.json does.
    const [program, stagesResp] = await Promise.all([
        api
            .get<{
                programs?: {
                    programTrackedEntityAttributes?: {
                        sortOrder?: number;
                        trackedEntityAttribute: { id: string; name: string; formName?: string };
                    }[];
                }[];
                dataElements?: ProgramField[];
                trackedEntityAttributes?: ProgramField[];
                options?: { code: string; name: string; optionSet?: { id: string } }[];
            }>(`/programs/${programId}/metadata.json`, {
                fields: "programs,dataElements,trackedEntityAttributes,programTrackedEntityAttributes,options",
            })
            .getData(),
        api
            .get<{ programStages?: D2ProgramStage[] }>("/programStages.json", {
                filter: `program.id:eq:${programId}`,
                fields:
                    "id,name,repeatable,sortOrder," +
                    "programStageDataElements[sortOrder,dataElement[id,name,formName]]," +
                    "programStageSections[name,sortOrder,dataElements[id]]",
                paging: false,
            })
            .getData(),
    ]);

    const attributes = new Map<string, string>();
    const attributeOrder = new Map<string, number>();
    for (const tea of program.trackedEntityAttributes ?? []) {
        attributes.set(tea.id, fieldLabel(tea));
    }
    for (const p of program.programs ?? []) {
        (p.programTrackedEntityAttributes ?? []).forEach((ptea, index) => {
            const tea = ptea.trackedEntityAttribute;
            if (!attributes.has(tea.id)) attributes.set(tea.id, fieldLabel(tea));
            attributeOrder.set(tea.id, ptea.sortOrder ?? index);
        });
    }

    const stages = [...(stagesResp.programStages ?? [])].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );

    const stageById = new Map<string, ProgramStageMeta>();
    stages.forEach((stage, stageIndex) => {
        const dataElementLabels = new Map<string, string>();
        const dataElementOrder = new Map<string, number>();
        (stage.programStageDataElements ?? []).forEach((psde, index) => {
            const de = psde.dataElement;
            dataElementLabels.set(de.id, de.formName || de.name);
            dataElementOrder.set(de.id, psde.sortOrder ?? index);
        });
        placeSpeciesOtherAfterSpecies(dataElementLabels, dataElementOrder);

        const dataElementSection = new Map<string, string>();
        for (const section of stage.programStageSections ?? []) {
            for (const de of section.dataElements ?? [])
                dataElementSection.set(de.id, section.name);
        }

        stageById.set(stage.id, {
            id: stage.id,
            name: stage.name,
            repeatable: !!stage.repeatable,
            sortOrder: stage.sortOrder ?? stageIndex,
            dataElementLabels,
            dataElementOrder,
            dataElementSection,
        });
    });

    const namesByOptionSet = new Map<string, Map<string, string>>();
    for (const option of program.options ?? []) {
        const setId = option.optionSet?.id;
        if (!setId) continue;
        const names = namesByOptionSet.get(setId) ?? new Map<string, string>();
        names.set(option.code, option.name);
        namesByOptionSet.set(setId, names);
    }

    const valueTypes = new Map<string, string>();
    const optionNames = new Map<string, Map<string, string>>();
    const fieldNames = new Map<string, string>();
    for (const stage of stages) {
        for (const { dataElement } of stage.programStageDataElements ?? [])
            fieldNames.set(dataElement.id, dataElement.name);
    }
    for (const field of [
        ...(program.dataElements ?? []),
        ...(program.trackedEntityAttributes ?? []),
    ]) {
        fieldNames.set(field.id, field.name);
        if (field.valueType) valueTypes.set(field.id, field.valueType);
        const names = field.optionSet && namesByOptionSet.get(field.optionSet.id);
        if (names) optionNames.set(field.id, names);
    }

    return { attributes, attributeOrder, stageById, valueTypes, optionNames, fieldNames };
}

const SPECIES_LABEL = "Specify the species";
const SPECIES_OTHER_LABEL = "Species, other";

/**
 * On the Central Ref Lab form, the free-text "Species, other" (what the lab typed when the
 * species list had no match) is the last field of each species stage, ~120 columns after
 * the "Specify the species" it qualifies, with the antibiotic blocks in between. Anyone
 * reading the export sees "Other" and never reaches the text, so move it to sit directly
 * after its species. Mutates `order`; a stage lacking either field is left untouched.
 */
export function placeSpeciesOtherAfterSpecies(
    labels: Map<string, string>,
    order: Map<string, number>
): void {
    const idOf = (label: string) => [...labels].find(([, l]) => l === label)?.[0];
    const speciesId = idOf(SPECIES_LABEL);
    const otherId = idOf(SPECIES_OTHER_LABEL);
    const speciesPosition = speciesId === undefined ? undefined : order.get(speciesId);
    if (otherId === undefined || speciesPosition === undefined) return;

    order.set(otherId, speciesPosition + 0.5);
}

/**
 * The label a column gets, before de-duplication: the form's own section name where the
 * stage defines one (e.g. "S1 - Antibiotic 1"), otherwise the stage name.
 */
function stageColumnLabel(
    stage: ProgramStageMeta,
    dataElementId: string,
    fieldLabel: string
): string {
    return `${stage.dataElementSection.get(dataElementId) ?? stage.name}: ${fieldLabel}`;
}

/**
 * Marks a main-sheet column as coming from a program-stage data element rather than a
 * tracked-entity attribute, so the two id spaces can share one column map.
 */
const STAGE_COLUMN_PREFIX = "stage:";

/** Where a column belongs in form order. Attributes first, then stage data in stage order. */
const STAGE_COLUMN_OFFSET = 1_000_000;

/** Sorts after every field of `stage` (or, with no stage, after every attribute). */
function afterStagePosition(stage: ProgramStageMeta | undefined): number {
    return STAGE_COLUMN_OFFSET * (1 + (stage ? 1 + stage.sortOrder : 0)) - 1;
}

function columnSortKey(columnKey: string, meta: ProgramMeta): number {
    const isStageValue = columnKey.startsWith(STAGE_COLUMN_PREFIX);
    const id = isStageValue ? columnKey.slice(STAGE_COLUMN_PREFIX.length) : columnKey;

    if (!isStageValue) {
        const attrPosition = meta.attributeOrder.get(id);
        if (attrPosition !== undefined) return attrPosition;
    }
    for (const stage of meta.stageById.values()) {
        const position = stage.dataElementOrder.get(id);
        if (position !== undefined) {
            return STAGE_COLUMN_OFFSET * (1 + stage.sortOrder) + position;
        }
    }
    // Not in this program's metadata (e.g. a field since unassigned from its stage):
    // keep it after everything known, rather than guessing a position.
    return Number.MAX_SAFE_INTEGER;
}

/**
 * Puts columns into form order. Order matters for reading: the Central Ref Lab form repeats
 * a 4-field block per antibiotic, and without this the antibiotic and its own AST result do
 * not end up side by side. Off-form columns go after their stage's fields, by label.
 */
export function orderColumns(
    columns: Map<string, string>,
    meta: ProgramMeta,
    offForm?: Map<string, OffFormField>
): Map<string, string> {
    const position = (key: string) => offForm?.get(key)?.position ?? columnSortKey(key, meta);
    return new Map(
        [...columns.entries()].sort(
            ([a, labelA], [b, labelB]) =>
                position(a) - position(b) ||
                labelA.localeCompare(labelB, undefined, { numeric: true })
        )
    );
}

/**
 * Makes every header unique, keeping order. Two different fields can carry the same form
 * label (two programs merged into one sheet, or one form reusing a label), and a form label
 * can equal one of the extract's own headers (`reserved`). Such a header gets the field's
 * DHIS2 name, which is unique, in brackets: "Unique facility ID [Unique facility ID-Fup]".
 * Whatever still repeats is numbered in column order. Applied once, at write time, so it sees
 * the final (merged) column set.
 */
export function uniqueLabels(
    columns: Map<string, string>,
    dhis2Names: Map<string, string> = new Map(),
    reserved: ReadonlySet<string> = new Set()
): Map<string, string> {
    const count = (labels: Iterable<string>) => {
        const counts = new Map<string, number>();
        for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
        return counts;
    };

    const firstCounts = count(columns.values());
    const named = new Map<string, string>();
    for (const [key, label] of columns) {
        const clash = (firstCounts.get(label) ?? 0) > 1 || reserved.has(label);
        const name = dhis2Names.get(key);
        named.set(key, clash && name && name !== label ? `${label} [${name}]` : label);
    }

    const counts = count(named.values());
    const seen = new Map<string, number>();
    const result = new Map<string, string>();
    for (const [key, label] of named) {
        if ((counts.get(label) ?? 0) === 1 && !reserved.has(label)) {
            result.set(key, label);
            continue;
        }
        const occurrence = (seen.get(label) ?? 0) + 1;
        seen.set(label, occurrence);
        result.set(key, `${label} #${occurrence}`);
    }
    return result;
}

/** The section shown for a tracker program's own attributes (its registration fields). */
const REGISTRATION_SECTION = "Registration";

/**
 * Every field configured on the form, keyed and labelled exactly as the record builders key
 * and label the values they meet, so a question nobody answered still gets its column. With
 * `stage`: that repeatable stage's own sheet. Otherwise the main sheet: a tracker program's
 * attributes and single-entry stages, or every stage of an event program.
 */
export function configuredColumns(
    meta: ProgramMeta,
    kind: FormKind,
    stage?: ProgramStageMeta
): Map<string, string> {
    const columns = new Map<string, string>();
    if (stage) return new Map(stage.dataElementLabels);

    const stages = [...meta.stageById.values()];
    if (kind === "event") {
        for (const s of stages)
            for (const [id, label] of s.dataElementLabels) columns.set(id, label);
        return columns;
    }
    for (const id of meta.attributeOrder.keys()) columns.set(id, meta.attributes.get(id) ?? id);
    for (const s of stages.filter(s => !s.repeatable)) {
        for (const [id, label] of s.dataElementLabels) {
            columns.set(`${STAGE_COLUMN_PREFIX}${id}`, stageColumnLabel(s, id, label));
        }
    }
    return columns;
}

/** Section and DHIS2 name of each column (see ColumnInfo); "" where the form no longer has it. */
export function describeColumns(
    columns: Map<string, string>,
    meta: ProgramMeta,
    stage?: ProgramStageMeta
): Map<string, ColumnInfo> {
    const info = new Map<string, ColumnInfo>();
    for (const key of columns.keys()) {
        const isStageValue = key.startsWith(STAGE_COLUMN_PREFIX);
        const id = isStageValue ? key.slice(STAGE_COLUMN_PREFIX.length) : key;
        const owner = stage ?? [...meta.stageById.values()].find(s => s.dataElementLabels.has(id));
        const isAttribute = !stage && !isStageValue && meta.attributeOrder.has(id);
        const section = isAttribute
            ? REGISTRATION_SECTION
            : owner?.dataElementLabels.has(id)
            ? owner.dataElementSection.get(id) ?? owner.name
            : "";
        info.set(key, { section, dhis2Name: meta.fieldNames.get(id) ?? "", id });
    }
    return info;
}

// --- Extraction ---------------------------------------------------------------

type FetchOpts = {
    orgUnit?: string;
    pageSize: number;
    startDate?: string;
    endDate?: string;
    /** Discovered record count of the program being fetched, when known: enables parallel pages. */
    total?: number;
    /** The run's shared cap on full-page data requests. */
    requests: Limiter;
    /** Org units to read dataSets under when no --org-unit/--country scope is given. */
    dataSetRoots?: string[];
};

/**
 * The ResolvedForm shape a repeatable stage's child sheet gets. Shared by fetchTracker
 * (which creates these for real) and discovery's forecast (which previews them before any
 * extraction runs), so a predicted sheet can never describe a shape extraction wouldn't
 * actually produce.
 */
export function buildStageChildForm(
    owner: ResolvedForm,
    stage: ProgramStageMeta,
    childKey: string
): ResolvedForm {
    return {
        key: childKey,
        requestedName: stage.name,
        parentKey: owner.key,
        uid: `${owner.uid}#${stage.id}`,
        serverName: stage.name,
        kind: "trackerStage",
        defaultUid: `${owner.defaultUid}#${stage.id}`,
        title: `${owner.title} - ${stage.name}`,
        isCustom: owner.isCustom,
        // Not a stored attribute: parentId is the owning TEI's own id, so there is no
        // attribute UID to record here.
        parentLinkField: "",
        surveyLinkField: "",
    };
}

/**
 * Deterministic, collision-safe internal key for a repeatable stage's child sheet. Given
 * the same owner + stage processed in the same (id-sorted) order, this always produces the
 * same key — which is what lets discovery's prediction match extraction's actual output.
 */
export function assignStageChildKey(
    ownerKey: string,
    stage: ProgramStageMeta,
    usedKeys: Set<string>
): string {
    const baseKey = `${ownerKey}__${pascalizeStageName(stage.name)}`;
    const childKey = usedKeys.has(baseKey) ? `${baseKey}__${stage.id}` : baseKey;
    usedKeys.add(childKey);
    return childKey;
}

function ouParams(orgUnit: string | undefined) {
    // ACCESSIBLE returns everything the authenticated user may read, which is
    // what "all data" means here. A root org unit narrows it to that subtree.
    return orgUnit
        ? { orgUnit, ouMode: "DESCENDANTS" as const }
        : { ouMode: "ACCESSIBLE" as const };
}

/**
 * Guards the paging loops. Returns the items of a page not seen on an earlier page, so a
 * record that shifts between pages while the data changes is never written twice. Returns
 * undefined once a page adds nothing new: a server that ignores `page` would otherwise
 * return the same page forever.
 */
export function makePageGuard(formKey: string) {
    const seen = new Set<string>();

    return function fresh<T>(items: T[], idOf: (item: T) => string): T[] | undefined {
        const added = items.filter(item => !seen.has(idOf(item)));
        added.forEach(item => seen.add(idOf(item)));

        if (items.length > 0 && added.length === 0) {
            console.warn(
                `\n  ! ${formKey}: a page returned no new records; stopping to avoid a paging loop.`
            );
            return undefined;
        }
        return added;
    };
}

// --- Program-stage event handling ----------------------------------------------
//
// A tracker TEI carries data in two places: tracked-entity attributes, and events on
// its enrollment's program stages. A non-repeatable stage has at most one event per
// TEI, so its dataValues can be flattened onto the same row as extra columns. A
// repeatable stage can have many events per TEI (e.g. multiple ward records per
// facility) — that is a different cardinality, so it becomes its own child sheet,
// one row per event, FK'd back to the owning TEI.

export type StageEventInput = {
    event: string;
    programStage: string;
    occurredAt?: string;
    status?: string;
    dataValues?: { dataElement: string; value?: string | number | boolean | null }[];
};

export type TrackedEntityInput = {
    trackedEntity: string;
    orgUnit?: string;
    createdAt?: string;
    updatedAt?: string;
    attributes?: { attribute: string; value?: string | number | boolean | null }[];
    /** Enrolment-level metadata, taken from the TEI's first enrolment. */
    enrollment?: { enrolledAt?: string; status?: string };
    /** Events from ALL of the TEI's enrolments — never just the first, or a second
     * enrolment's events would vanish from the extract without a trace. */
    events?: StageEventInput[];
};

export type StageChildRecord = { stageId: string; record: Record_ };

/**
 * Builds one TEI's main row (attributes + non-repeatable-stage dataValues merged in)
 * plus one child Record_ per repeatable-stage event. Mutates `columns` and
 * `stageColumns` (per stage id) with any newly-seen column, matching the accumulation
 * pattern the rest of this file uses. Values of fields no longer on the form are kept and
 * noted in `offForm` (see OffFormField).
 */
export function buildTrackerRecords(
    tei: TrackedEntityInput,
    form: ResolvedForm,
    meta: ProgramMeta,
    columns: Map<string, string>,
    stageColumns: Map<string, Map<string, string>>,
    report?: IntegrityReport,
    offForm?: OffFormTracker
): { main: Record_; stageRecords: StageChildRecord[] } {
    const values = new Map<string, string>();
    for (const attr of tei.attributes ?? []) {
        if (attr.value === undefined || attr.value === null) continue;
        values.set(attr.attribute, displayValue(meta, attr.attribute, String(attr.value)));
        const label = meta.attributes.get(attr.attribute);
        if (label === undefined) {
            noteOffForm(offForm, "", attr.attribute, {
                kind: "trackedEntityAttribute",
                id: attr.attribute,
                position: afterStagePosition(undefined),
                prefix: "",
            });
        }
        if (!columns.has(attr.attribute)) columns.set(attr.attribute, label ?? attr.attribute);
    }

    const stageRecords: StageChildRecord[] = [];
    const filledStages = new Set<string>();

    for (const event of tei.events ?? []) {
        const stage = meta.stageById.get(event.programStage);
        if (!stage) {
            // Unknown stage: this event's data cannot be classified as repeatable or not,
            // so it is skipped. Not silent — every occurrence is counted and surfaced in
            // _index (see recordUnresolvedStageEvent), never just dropped unnoticed.
            if (report) recordUnresolvedStageEvent(report, form.key, event.programStage);
            continue;
        }

        if (!stage.repeatable) {
            // A single-entry stage's values share one row, so a second event with data
            // overwrites the first's. Not silent: counted and surfaced in _index.
            if ((event.dataValues?.length ?? 0) > 0) {
                if (filledStages.has(stage.id) && report) {
                    incrementStageCount(report.duplicateStageEvents, form.key, stage.id);
                }
                filledStages.add(stage.id);
            }
            for (const dv of event.dataValues ?? []) {
                if (dv.value === undefined || dv.value === null) continue;
                const key = `${STAGE_COLUMN_PREFIX}${dv.dataElement}`;
                values.set(key, displayValue(meta, dv.dataElement, String(dv.value)));
                const label = stage.dataElementLabels.get(dv.dataElement);
                if (label === undefined) {
                    noteOffForm(offForm, "", key, {
                        kind: "dataElement",
                        id: dv.dataElement,
                        position: afterStagePosition(stage),
                        prefix: `${stage.name}: `,
                    });
                }
                if (!columns.has(key)) {
                    columns.set(
                        key,
                        stageColumnLabel(stage, dv.dataElement, label ?? dv.dataElement)
                    );
                }
            }
        }
    }

    const surveyId = form.surveyLinkField ? values.get(form.surveyLinkField) ?? "" : "";
    const main: Record_ = {
        id: tei.trackedEntity,
        parentId: form.parentLinkField ? values.get(form.parentLinkField) ?? "" : "",
        surveyId,
        facilityId: "", // derived later by resolveFacilityIds()
        orgUnit: tei.orgUnit ?? "",
        values,
        meta: new Map<string, string>([
            ["created_at", tei.createdAt ?? ""],
            ["updated_at", tei.updatedAt ?? ""],
            ["enrolled_at", tei.enrollment?.enrolledAt ?? ""],
            ["status", tei.enrollment?.status ?? ""],
            ["program", form.serverName],
        ]),
        flags: [],
    };

    for (const event of tei.events ?? []) {
        const stage = meta.stageById.get(event.programStage);
        // An unresolved stage was already counted in the loop above (same event list);
        // don't record it twice here.
        if (!stage || !stage.repeatable) continue;

        const childValues = new Map<string, string>();
        let childColumns = stageColumns.get(stage.id);
        if (!childColumns) {
            childColumns = new Map<string, string>();
            stageColumns.set(stage.id, childColumns);
        }
        for (const dv of event.dataValues ?? []) {
            if (dv.value === undefined || dv.value === null) continue;
            childValues.set(dv.dataElement, displayValue(meta, dv.dataElement, String(dv.value)));
            const label = stage.dataElementLabels.get(dv.dataElement);
            if (label === undefined) {
                noteOffForm(offForm, stage.id, dv.dataElement, {
                    kind: "dataElement",
                    id: dv.dataElement,
                    position: afterStagePosition(stage),
                    prefix: "",
                });
            }
            if (!childColumns.has(dv.dataElement))
                childColumns.set(dv.dataElement, label ?? dv.dataElement);
        }

        stageRecords.push({
            stageId: stage.id,
            record: {
                id: event.event,
                parentId: tei.trackedEntity,
                surveyId,
                facilityId: "",
                orgUnit: tei.orgUnit ?? "",
                values: childValues,
                meta: new Map([
                    ["occurred_at", event.occurredAt ?? ""],
                    ["status", event.status ?? ""],
                    ["program", form.serverName],
                ]),
                flags: [],
            },
        });
    }

    return { main, stageRecords };
}

/** Ids per metadata request: keeps `id:in:[...]` URLs well under server limits. */
const ID_BATCH = 100;

type FieldInfo = { name: string; valueType?: string; options: Map<string, string> };

/** Full name, valueType and option names of the given fields. */
async function fetchFieldInfo(
    api: D2Api,
    session: SessionManager,
    kind: OffFormField["kind"],
    ids: string[]
): Promise<Map<string, FieldInfo>> {
    const endpoint = kind === "dataElement" ? "dataElements" : "trackedEntityAttributes";
    const info = new Map<string, FieldInfo>();

    for (let i = 0; i < ids.length; i += ID_BATCH) {
        const batch = ids.slice(i, i + ID_BATCH);
        const resp = await session.retryWithBackoff(() =>
            api
                .get<{
                    [endpoint: string]:
                        | {
                              id: string;
                              name: string;
                              valueType?: string;
                              optionSet?: { options?: { code: string; name: string }[] };
                          }[]
                        | undefined;
                }>(`/${endpoint}.json`, {
                    filter: `id:in:[${batch.join(",")}]`,
                    fields: "id,name,valueType,optionSet[options[code,name]]",
                    paging: false,
                })
                .getData()
        );
        for (const field of resp[endpoint] ?? []) {
            info.set(field.id, {
                name: field.name,
                valueType: field.valueType,
                options: new Map((field.optionSet?.options ?? []).map(o => [o.code, o.name])),
            });
        }
    }
    return info;
}

type SheetInProgress = { columns: Map<string, string>; records: Record_[] };

/**
 * Labels the off-form columns of one program's sheets with each field's full DHIS2 name,
 * turns their option codes into names (the program's own metadata no longer covers them)
 * and records their valueType. A field whose metadata is gone entirely keeps its id as the
 * label and is reported in report.unresolvedHeaders.
 */
async function labelOffFormFields(
    api: D2Api,
    session: SessionManager,
    formKey: string,
    tracker: OffFormTracker,
    sheets: Map<string, SheetInProgress>,
    report: IntegrityReport
): Promise<void> {
    const fields = [...tracker.values()].flatMap(byColumn => [...byColumn.values()]);
    if (fields.length === 0) return;

    const idsOf = (kind: OffFormField["kind"]) => [
        ...new Set(fields.filter(f => f.kind === kind).map(f => f.id)),
    ];
    const [dataElements, attributes] = await Promise.all([
        fetchFieldInfo(api, session, "dataElement", idsOf("dataElement")),
        fetchFieldInfo(api, session, "trackedEntityAttribute", idsOf("trackedEntityAttribute")),
    ]);

    for (const [sheet, byColumn] of tracker) {
        const target = sheets.get(sheet);
        if (!target) continue;

        for (const [columnKey, field] of byColumn) {
            const info = (field.kind === "dataElement" ? dataElements : attributes).get(field.id);
            if (!info) {
                target.columns.set(columnKey, `${field.prefix}${field.id} [deleted field]`);
                report.unresolvedHeaders.push({ formKey, id: field.id, kind: field.kind });
                continue;
            }
            target.columns.set(columnKey, `${field.prefix}${info.name} ${OFF_FORM_MARK}`);
            field.valueType = info.valueType;
            if (info.options.size === 0) continue;
            for (const record of target.records) {
                const value = record.values.get(columnKey);
                const name = value === undefined ? undefined : info.options.get(value);
                if (name !== undefined) record.values.set(columnKey, name);
            }
        }
    }
}

/** Lists a sheet's off-form columns, with their value counts, for _index. */
function reportOffForm(
    report: IntegrityReport,
    sheet: string,
    fields: Map<string, OffFormField> | undefined,
    columns: Map<string, string>
): void {
    for (const [columnKey, field] of fields ?? []) {
        report.offFormFields.push({
            sheet,
            column: columns.get(columnKey) ?? columnKey,
            values: field.values,
        });
    }
}

/**
 * Word-boundary-preserving PascalCase fragment from a stage name, e.g.
 * "Ward data" -> "WardData" (not "Warddata" — blind non-alnum stripping loses the
 * boundary between words, which makes multi-word stage names unreadable).
 */
export function pascalizeStageName(name: string): string {
    const words = name.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    const pascal = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    return pascal || "Stage";
}

/** The valueType of each column, so the writer can emit real numbers and dates. */
function columnValueTypes(
    columns: Map<string, string>,
    meta: ProgramMeta,
    offForm?: Map<string, OffFormField>
): Map<string, string> {
    const types = new Map<string, string>();
    for (const key of columns.keys()) {
        const fieldId = key.startsWith(STAGE_COLUMN_PREFIX)
            ? key.slice(STAGE_COLUMN_PREFIX.length)
            : key;
        const type = offForm?.get(key)?.valueType ?? meta.valueTypes.get(fieldId);
        if (type) types.set(key, type);
    }
    return types;
}

/**
 * Every record of a paged endpoint, in page order, each once. With a known total (from
 * discovery) every page is requested at once and the shared request limiter paces them;
 * without one, and past the known pages if records were added since discovery, pages are
 * read one at a time until a short page. A record that shifts between pages while the data
 * changes is kept once; reconciliation reports any change in count.
 */
export async function fetchAllPages<T>(
    formKey: string,
    pageSize: number,
    total: number | undefined,
    fetchPage: (page: number) => Promise<T[]>,
    idOf: (item: T) => string
): Promise<T[]> {
    const fresh = makePageGuard(formKey);
    const items: T[] = [];
    const take = (page: T[]): boolean => {
        const added = fresh(page, idOf);
        if (added) items.push(...added);
        return added !== undefined;
    };

    const known = total ? Math.ceil(total / pageSize) : 0;
    const pages = await Promise.all(Array.from({ length: known }, (_, i) => fetchPage(i + 1)));
    pages.forEach(take);

    let last = pages[pages.length - 1];
    for (let page = known + 1; !last || last.length === pageSize; page++) {
        last = await fetchPage(page);
        if (!take(last)) break;
    }
    return items;
}

async function fetchTracker(
    api: D2Api,
    form: ResolvedForm,
    meta: ProgramMeta,
    opts: FetchOpts,
    session: SessionManager,
    report: IntegrityReport
): Promise<{ main: FormData; stageForms: FormData[] }> {
    const teis = await fetchAllPages(
        form.key,
        opts.pageSize,
        opts.total,
        page =>
            opts
                .requests(() =>
                    session.retryWithBackoff(() =>
                        api.tracker.trackedEntities
                            .get({
                                fields: {
                                    trackedEntity: true,
                                    orgUnit: true,
                                    createdAt: true,
                                    updatedAt: true,
                                    attributes: { attribute: true, value: true },
                                    enrollments: {
                                        enrollment: true,
                                        enrolledAt: true,
                                        status: true,
                                        events: {
                                            event: true,
                                            programStage: true,
                                            occurredAt: true,
                                            status: true,
                                            dataValues: { dataElement: true, value: true },
                                        },
                                    },
                                },
                                program: form.uid,
                                ...ouParams(opts.orgUnit),
                                // An explicit order keeps pages stable while records are added.
                                order: [{ type: "field", field: "createdAt", direction: "asc" }],
                                page,
                                pageSize: opts.pageSize,
                                totalPages: false,
                            })
                            .getData()
                    )
                )
                .then(resp => resp.instances ?? []),
        tei => tei.trackedEntity
    );

    const records: Record_[] = [];
    const columns = new Map<string, string>();
    // stage id -> child rows / columns of a repeatable stage.
    const stageRows = new Map<string, Record_[]>();
    const stageColumns = new Map<string, Map<string, string>>();
    const offForm: OffFormTracker = new Map();

    for (const tei of teis) {
        const enrollments = tei.enrollments ?? [];
        const first = enrollments[0];
        const { main, stageRecords } = buildTrackerRecords(
            {
                trackedEntity: tei.trackedEntity,
                orgUnit: tei.orgUnit,
                createdAt: tei.createdAt,
                updatedAt: tei.updatedAt,
                attributes: tei.attributes,
                enrollment: first && { enrolledAt: first.enrolledAt, status: first.status },
                events: enrollments.flatMap(e => e.events ?? []),
            },
            form,
            meta,
            columns,
            stageColumns,
            report,
            offForm
        );
        records.push(main);
        for (const { stageId, record } of stageRecords) {
            const rows = stageRows.get(stageId);
            if (rows) rows.push(record);
            else stageRows.set(stageId, [record]);
        }
    }
    console.log(`  ${form.key}: ${records.length} records`);

    const sheets = new Map<string, SheetInProgress>([["", { columns, records }]]);
    for (const [stageId, childColumns] of stageColumns) {
        sheets.set(stageId, { columns: childColumns, records: stageRows.get(stageId) ?? [] });
    }
    await labelOffFormFields(api, session, form.key, offForm, sheets, report);

    // Every repeatable stage gets its sheet, with or without events. Sorted by stage id
    // (immutable, DHIS2-assigned) before keys are assigned, as discovery's forecast does, so
    // predicted and actual sheet keys match.
    const usedKeys = new Set<string>([form.key]);
    const stageForms: FormData[] = [];
    const repeatable = [...meta.stageById.values()]
        .filter(stage => stage.repeatable)
        .sort((a, b) => a.id.localeCompare(b.id));
    for (const stage of repeatable) {
        const childKey = assignStageChildKey(form.key, stage, usedKeys);
        const childOffForm = offForm.get(stage.id);
        const unordered = withConfiguredColumns(
            stageColumns.get(stage.id) ?? new Map<string, string>(),
            configuredColumns(meta, form.kind, stage)
        );
        reportOffForm(report, childKey, childOffForm, unordered);
        const childColumns = orderColumns(unordered, meta, childOffForm);
        stageForms.push({
            form: buildStageChildForm(form, stage, childKey),
            records: stageRows.get(stage.id) ?? [],
            columns: childColumns,
            valueTypes: columnValueTypes(childColumns, meta, childOffForm),
            columnInfo: describeColumns(childColumns, meta, stage),
        });
    }

    reportOffForm(report, form.key, offForm.get(""), columns);
    const mainColumns = orderColumns(
        withConfiguredColumns(columns, configuredColumns(meta, form.kind)),
        meta,
        offForm.get("")
    );
    return {
        main: {
            form,
            records,
            columns: mainColumns,
            valueTypes: columnValueTypes(mainColumns, meta, offForm.get("")),
            columnInfo: describeColumns(mainColumns, meta),
        },
        stageForms,
    };
}

/** Adds the configured columns no record filled to the columns met in the data. */
function withConfiguredColumns(
    columns: Map<string, string>,
    configured: Map<string, string>
): Map<string, string> {
    for (const [key, label] of configured) if (!columns.has(key)) columns.set(key, label);
    return columns;
}

async function fetchEvents(
    api: D2Api,
    form: ResolvedForm,
    meta: ProgramMeta,
    opts: FetchOpts,
    session: SessionManager,
    report: IntegrityReport
): Promise<FormData> {
    const events = await fetchAllPages(
        form.key,
        opts.pageSize,
        opts.total,
        page =>
            opts
                .requests(() =>
                    session.retryWithBackoff(() =>
                        api.tracker.events
                            .get({
                                fields: {
                                    event: true,
                                    programStage: true,
                                    orgUnit: true,
                                    occurredAt: true,
                                    createdAt: true,
                                    updatedAt: true,
                                    status: true,
                                    dataValues: { dataElement: true, value: true },
                                },
                                program: form.uid,
                                ...ouParams(opts.orgUnit),
                                order: "createdAt:asc",
                                page,
                                pageSize: opts.pageSize,
                                totalPages: false,
                            })
                            .getData()
                    )
                )
                .then(resp => resp.instances ?? []),
        event => event.event
    );

    const columns = new Map<string, string>();
    const offForm: OffFormTracker = new Map();
    const records: Record_[] = events.map(event => {
        const stage = meta.stageById.get(event.programStage);
        const values = new Map<string, string>();
        for (const dv of event.dataValues ?? []) {
            if (dv.value === undefined || dv.value === null) continue;
            values.set(dv.dataElement, displayValue(meta, dv.dataElement, String(dv.value)));
            const label = stage?.dataElementLabels.get(dv.dataElement);
            if (label === undefined) {
                noteOffForm(offForm, "", dv.dataElement, {
                    kind: "dataElement",
                    id: dv.dataElement,
                    position: afterStagePosition(stage),
                    prefix: "",
                });
            }
            if (!columns.has(dv.dataElement)) columns.set(dv.dataElement, label ?? dv.dataElement);
        }

        return {
            id: event.event,
            parentId: form.parentLinkField ? values.get(form.parentLinkField) ?? "" : "",
            // The Survey form is itself the root: its own id is the survey id.
            surveyId: form.surveyLinkField ? values.get(form.surveyLinkField) ?? "" : event.event,
            facilityId: "",
            orgUnit: event.orgUnit ?? "",
            values,
            meta: new Map<string, string>([
                ["occurred_at", event.occurredAt ?? ""],
                ["created_at", event.createdAt ?? ""],
                ["updated_at", event.updatedAt ?? ""],
                ["status", event.status ?? ""],
                ["program", form.serverName],
            ]),
            flags: [],
        };
    });
    console.log(`  ${form.key}: ${records.length} records`);

    await labelOffFormFields(
        api,
        session,
        form.key,
        offForm,
        new Map([["", { columns, records }]]),
        report
    );
    reportOffForm(report, form.key, offForm.get(""), columns);
    const ordered = orderColumns(
        withConfiguredColumns(columns, configuredColumns(meta, form.kind)),
        meta,
        offForm.get("")
    );
    return {
        form,
        records,
        columns: ordered,
        valueTypes: columnValueTypes(ordered, meta, offForm.get("")),
        columnInfo: describeColumns(ordered, meta),
    };
}

/** dataValueSets has no cheap probe, so without explicit dates the whole history is read. */
const DATASET_DEFAULT_START_DATE = "2000-01-01";

const NUMERIC_VALUE_TYPES = new Set([
    "NUMBER",
    "INTEGER",
    "INTEGER_POSITIVE",
    "INTEGER_NEGATIVE",
    "INTEGER_ZERO_OR_POSITIVE",
    "PERCENTAGE",
    "UNIT_INTERVAL",
]);

type NamedRow = { id: string; name: string };

/** Names for everything a dataValue of this dataSet refers to by id. */
async function fetchDataSetNames(
    api: D2Api,
    session: SessionManager,
    uid: string
): Promise<{
    dataElements: Map<string, { label: string; valueType?: string }>;
    optionCombos: Map<string, string>;
    /** The dataSet's own attribute option combos (its wards): which values are its own. */
    attributeOptionCombos: Set<string>;
    /** Attribute option combo -> its ward's name ("W16"), without the specialty. */
    wardByAoc: Map<string, string>;
}> {
    const ds = await session.retryWithBackoff(() =>
        api
            .get<{
                categoryCombo?: {
                    categories?: { id: string; categoryOptions?: { id: string }[] }[];
                    categoryOptionCombos?: (NamedRow & { categoryOptions?: NamedRow[] })[];
                };
                dataSetElements?: {
                    dataElement: NamedRow & {
                        formName?: string;
                        valueType?: string;
                        categoryCombo?: { categoryOptionCombos?: NamedRow[] };
                    };
                }[];
            }>(`/dataSets/${uid}.json`, {
                fields:
                    "categoryCombo[categories[id,categoryOptions[id]]," +
                    "categoryOptionCombos[id,name,categoryOptions[id,name]]]," +
                    "dataSetElements[dataElement[id,name,formName,valueType,categoryCombo[categoryOptionCombos[id,name]]]]",
            })
            .getData()
    );

    const dataElements = new Map<string, { label: string; valueType?: string }>();
    const optionCombos = new Map<string, string>();
    for (const coc of ds.categoryCombo?.categoryOptionCombos ?? [])
        optionCombos.set(coc.id, coc.name);
    for (const { dataElement: de } of ds.dataSetElements ?? []) {
        dataElements.set(de.id, { label: de.formName || de.name, valueType: de.valueType });
        for (const coc of de.categoryCombo?.categoryOptionCombos ?? [])
            optionCombos.set(coc.id, coc.name);
    }
    const attributeOptionCombos = new Set(
        (ds.categoryCombo?.categoryOptionCombos ?? []).map(coc => coc.id)
    );

    // Ward Summary Statistics combines ward and specialty ("W18, NMW-NSW"); keep the ward only.
    const wardOptions = new Set(
        (ds.categoryCombo?.categories ?? [])
            .filter(category => category.id === WARD_ID_CATEGORY_ID)
            .flatMap(category => (category.categoryOptions ?? []).map(option => option.id))
    );
    const wardByAoc = new Map<string, string>();
    for (const coc of ds.categoryCombo?.categoryOptionCombos ?? []) {
        const ward = coc.categoryOptions?.find(option => wardOptions.has(option.id));
        if (ward) wardByAoc.set(coc.id, ward.name);
    }
    return { dataElements, optionCombos, attributeOptionCombos, wardByAoc };
}

/**
 * The ward statistics are aggregate dataSets, not programs: one row per dataValue, keyed by
 * data element, period, org unit (the facility) and the two option combos. The attribute
 * option combo identifies the ward (and, for Ward Summary Statistics, the specialty).
 *
 * The two ward dataSets share their data elements, and dataValueSets selects by data
 * element, so each request returns both dataSets' values (verified live: the same 230 values
 * twice). A value belongs to the dataSet whose attribute combo holds its ward; the others
 * are left to that dataSet's own sheet and counted in report.otherDataSetValues.
 */
async function fetchDataSet(
    api: D2Api,
    form: ResolvedForm,
    opts: FetchOpts,
    session: SessionManager,
    report: IntegrityReport
): Promise<FormData> {
    const orgUnits = opts.orgUnit ? [opts.orgUnit] : opts.dataSetRoots ?? [];
    const columns = new Map<string, string>([
        ["period", "Period"],
        ["ward", "Ward"],
        ["data_element", "Data element"],
        ["disaggregation", "Disaggregation"],
        ["value", "Value"],
    ]);
    if (orgUnits.length === 0) {
        console.warn(`  ! ${form.key}: skipped (no org unit to read it under).`);
        return { form, records: [], columns };
    }

    const [resp, names] = await Promise.all([
        opts.requests(() =>
            session.retryWithBackoff(() =>
                api.dataValues
                    .getSet({
                        dataSet: [form.uid],
                        orgUnit: orgUnits,
                        startDate: opts.startDate ?? DATASET_DEFAULT_START_DATE,
                        endDate: opts.endDate ?? new Date().toISOString().slice(0, 10),
                        children: true,
                    })
                    .getData()
            )
        ),
        fetchDataSetNames(api, session, form.uid),
    ]);

    const nameOf = (id: string | undefined) => (id ? names.optionCombos.get(id) ?? id : "");
    const dataValues = resp.dataValues ?? [];
    const own = dataValues.filter(dv =>
        names.attributeOptionCombos.has(dv.attributeOptionCombo ?? "")
    );
    if (own.length < dataValues.length) {
        report.otherDataSetValues.push({
            formKey: form.key,
            count: dataValues.length - own.length,
        });
    }
    const records: Record_[] = own.map(dv => {
        const coc = nameOf(dv.categoryOptionCombo);
        return {
            id: `${dv.dataElement}-${dv.period}-${dv.orgUnit}-${dv.categoryOptionCombo}-${dv.attributeOptionCombo}`,
            parentId: "",
            surveyId: "",
            facilityId: "",
            orgUnit: dv.orgUnit ?? "",
            values: new Map<string, string>([
                ["period", String(dv.period ?? "")],
                ["ward", nameOf(dv.attributeOptionCombo)],
                ["data_element", names.dataElements.get(dv.dataElement)?.label ?? dv.dataElement],
                ["disaggregation", coc === "default" ? "" : coc],
                ["value", String(dv.value ?? "")],
            ]),
            meta: new Map<string, string>([
                ["last_updated", dv.lastUpdated ?? ""],
                ["stored_by", dv.storedBy ?? ""],
            ]),
            flags: [],
            wardName: names.wardByAoc.get(dv.attributeOptionCombo ?? ""),
        };
    });

    const allNumeric = [...names.dataElements.values()].every(
        de => de.valueType !== undefined && NUMERIC_VALUE_TYPES.has(de.valueType)
    );
    const others = dataValues.length - own.length;
    console.log(
        `  ${form.key}: ${records.length} data values` +
            (others > 0 ? ` (${others} more belong to the other ward dataSet's wards)` : "")
    );
    return { form, records, columns, valueTypes: new Map(allNumeric ? [["value", "NUMBER"]] : []) };
}

// --- Merging programs ---------------------------------------------------------

const joinUnique = (a: string, b: string) =>
    a === b ? a : [...new Set([...a.split("; "), ...b.split("; ")])].join("; ");

/**
 * A form can be backed by several programs: the default plus each custom variant. They share
 * most data elements, so their rows are stacked into ONE sheet per form key; the `program`
 * column says which program a row came from. Columns are the union in first-seen order, so
 * the default program's order leads. Repeatable-stage child sheets merge the same way.
 */
export function mergeByFormKey(all: FormData[]): FormData[] {
    const merged = new Map<string, FormData>();

    for (const data of all) {
        const prior = merged.get(data.form.key);
        if (!prior) {
            merged.set(data.form.key, data);
            continue;
        }

        const columns = new Map(prior.columns);
        for (const [key, label] of data.columns) if (!columns.has(key)) columns.set(key, label);

        merged.set(data.form.key, {
            form: {
                ...prior.form,
                uid: joinUnique(prior.form.uid, data.form.uid),
                serverName: joinUnique(prior.form.serverName, data.form.serverName),
                parentLinkField: joinUnique(prior.form.parentLinkField, data.form.parentLinkField),
                isCustom: prior.form.isCustom || data.form.isCustom,
            },
            records: prior.records.concat(data.records),
            columns,
            valueTypes: new Map([...(prior.valueTypes ?? []), ...(data.valueTypes ?? [])]),
            columnInfo: new Map([...(data.columnInfo ?? []), ...(prior.columnInfo ?? [])]),
        });
    }

    return [...merged.values()];
}

/**
 * Expected record count per sheet key: the discovered totals of the programs actually
 * extracted for it. A key is absent when any of its programs has no known total (dataSets,
 * runs without a scope), so reconciliation never compares against a partial number.
 */
export function expectedRecordCounts(
    extracted: ResolvedForm[],
    totalByUid: Map<string, number | undefined>,
    discoveries: FormDiscovery[] = []
): Map<string, number> {
    const sums = new Map<string, number>();
    const unknown = new Set<string>();

    for (const form of extracted) {
        const total = totalByUid.get(form.uid);
        if (total === undefined) unknown.add(form.key);
        else sums.set(form.key, (sums.get(form.key) ?? 0) + total);
    }
    for (const key of unknown) sums.delete(key);

    // Repeatable-stage sheets: discovery probed their row counts too.
    const extractedUids = new Set(extracted.map(f => f.uid));
    for (const d of discoveries) {
        if (!extractedUids.has(d.form.uid)) continue;
        for (const s of d.stages) sums.set(s.sheetKey, (sums.get(s.sheetKey) ?? 0) + s.rows);
    }
    return sums;
}

// --- Org unit names ------------------------------------------------------------

async function fetchOrgUnitNames(
    api: D2Api,
    session: SessionManager,
    ids: string[]
): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    const chunkSize = 200;

    for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const { organisationUnits } = await session.retryWithBackoff(() =>
            api.metadata
                .get({
                    organisationUnits: {
                        fields: { id: true, name: true },
                        filter: { id: { in: chunk } },
                    },
                })
                .getData()
        );
        for (const ou of organisationUnits) names.set(ou.id, ou.name);
    }

    return names;
}

// --- Workbook -----------------------------------------------------------------

const EXCEL_SHEET_NAME_MAX = 31;

/** A short, deterministic, order-independent id: a low-collision digest of the input,
 * NOT a cryptographic hash — this only needs to disambiguate a handful of sheet names. */
function shortStableId(input: string): string {
    let hash = 0x811c9dc5; // FNV-1a 32-bit offset basis
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0; // FNV-1a prime, kept unsigned 32-bit
    }
    return hash.toString(36);
}

export type SheetNameSource = {
    /** Internal graph key (e.g. "Facility", "Facility__WardData"). */
    key: string;
    /** The name wanted for the tab (the form's title); the key when absent. */
    name?: string;
    /** A stable, unique-per-source string to derive a disambiguation suffix from if the
     * sanitized/truncated name collides with another source's. Using each form's own DHIS2
     * uid (not an encounter-order counter) keeps the assignment stable across runs even if
     * API paging order changes. */
    stableId: string;
};

/**
 * Assigns every source a sheet name that is simultaneously: Excel-safe (forbidden chars
 * replaced, <=31 chars), collision-free against every other source AND against `reserved`,
 * and deterministic — processing order is a stable sort by `key`, so the result depends
 * only on the input names themselves, never on Map/array iteration order upstream.
 *
 * Any collision that needed a disambiguation suffix is appended to `report.sheetNameCollisions`
 * (if given) so it surfaces in `_index` rather than passing silently.
 */
export function assignSheetNames(
    sources: SheetNameSource[],
    reserved: string[] = [],
    report?: IntegrityReport
): Map<string, string> {
    const used = new Set<string>(reserved);
    const result = new Map<string, string>();

    for (const source of [...sources].sort((a, b) => a.key.localeCompare(b.key))) {
        const safeLabel = (source.name ?? source.key).replace(/[:\\/?*[\]]/g, "-");
        let name = safeLabel.slice(0, EXCEL_SHEET_NAME_MAX);

        if (used.has(name)) {
            let attempt = 0;
            let candidate: string;
            do {
                const id =
                    attempt === 0
                        ? shortStableId(source.stableId)
                        : `${shortStableId(source.stableId)}${attempt}`;
                const suffix = `~${id}`;
                candidate =
                    safeLabel.slice(0, Math.max(0, EXCEL_SHEET_NAME_MAX - suffix.length)) + suffix;
                attempt++;
            } while (used.has(candidate) && attempt < 1000);
            name = candidate;
            report?.sheetNameCollisions.push({ key: source.key, assignedName: name });
            console.warn(`  ! sheet name collision resolved: ${source.key} -> "${name}"`);
        }

        used.add(name);
        result.set(source.key, name);
    }

    return result;
}

/**
 * Run-level findings for _index and the console. Record-level problems (orphans, test data,
 * survey mismatches) are not here: they are flags on the records themselves (flagRecords).
 */
export type IntegrityReport = {
    /** (survey, orgUnit) pairs matching more than one Facility record. */
    ambiguousFacilities: { surveyId: string; orgUnit: string; facilityIds: string[] }[];
    /** Columns of fields no longer on the form, with how many values they hold. */
    offFormFields: { sheet: string; column: string; values: number }[];
    /** dataValues a dataSet request returned that belong to another dataSet's wards (see fetchDataSet). */
    otherDataSetValues: { formKey: string; count: number }[];
    /** Records for which no Facility could be derived. */
    unresolvedFacility: { formKey: string; count: number }[];
    /** Case reports whose ward code is not on their facility's ward list (no Ward_id). */
    unresolvedWard: { formKey: string; count: number }[];
    /** Org units whose Facility records give different Hospital IDs: ward statistics there get no Facility_code. */
    ambiguousFacilityCodes: { orgUnit: string; codes: string[] }[];
    /** Stage events whose programStage id did not resolve in program metadata (data was skipped). */
    unresolvedStageEvents: { formKey: string; programStage: string; count: number }[];
    /** Extra events (with data) on a single-entry stage: their values overwrote the earlier event's in the shared row. */
    duplicateStageEvents: { formKey: string; programStage: string; count: number }[];
    /** Sheet names that needed a disambiguation suffix to stay unique. */
    sheetNameCollisions: { key: string; assignedName: string }[];
    /** Off-form fields whose metadata no longer exists at all: the header shows the raw id. */
    unresolvedHeaders: {
        formKey: string;
        id: string;
        kind: "dataElement" | "trackedEntityAttribute";
    }[];
};

export function emptyIntegrityReport(): IntegrityReport {
    return {
        ambiguousFacilities: [],
        offFormFields: [],
        otherDataSetValues: [],
        unresolvedFacility: [],
        unresolvedWard: [],
        ambiguousFacilityCodes: [],
        unresolvedStageEvents: [],
        duplicateStageEvents: [],
        sheetNameCollisions: [],
        unresolvedHeaders: [],
    };
}

function incrementStageCount(
    counts: IntegrityReport["unresolvedStageEvents"],
    formKey: string,
    programStage: string
): void {
    const existing = counts.find(u => u.formKey === formKey && u.programStage === programStage);
    if (existing) existing.count += 1;
    else counts.push({ formKey, programStage, count: 1 });
}

/** Records one occurrence of an event whose programStage id did not resolve in metadata. */
export function recordUnresolvedStageEvent(
    report: IntegrityReport,
    formKey: string,
    programStage: string
): void {
    incrementStageCount(report.unresolvedStageEvents, formKey, programStage);
}

/** A sheet's readable title from its internal key, for messages. */
function titleLookup(all: FormData[]): (key: string) => string {
    const titles = new Map(all.map(d => [d.form.key, d.form.title]));
    return key => titles.get(key) ?? key;
}

export function reportIntegrity(report: IntegrityReport, all: FormData[]): void {
    const titleOf = titleLookup(all);
    const {
        ambiguousFacilities,
        offFormFields,
        unresolvedFacility,
        unresolvedWard,
        ambiguousFacilityCodes,
        unresolvedStageEvents,
        duplicateStageEvents,
        sheetNameCollisions,
        unresolvedHeaders,
    } = report;
    const flagged = summariseFlags(all);
    if (
        flagged.length === 0 &&
        ambiguousFacilities.length === 0 &&
        offFormFields.length === 0 &&
        unresolvedFacility.length === 0 &&
        unresolvedWard.length === 0 &&
        ambiguousFacilityCodes.length === 0 &&
        unresolvedStageEvents.length === 0 &&
        duplicateStageEvents.length === 0 &&
        sheetNameCollisions.length === 0 &&
        unresolvedHeaders.length === 0
    ) {
        console.log(
            "  integrity: no flagged records, no off-form fields, no skipped or overwritten events."
        );
        return;
    }

    console.warn("\n  ! Integrity findings (see the _index sheet for detail):");
    for (const f of flagged)
        console.warn(`      ${f.sheet}: ${f.count} record(s) flagged ${f.flag}`);
    if (offFormFields.length > 0) {
        const values = offFormFields.reduce((sum, f) => sum + f.values, 0);
        console.warn(
            `      ${offFormFields.length} column(s) of fields no longer on the form, ${values} value(s) kept`
        );
    }
    if (unresolvedFacility.length > 0) {
        for (const u of unresolvedFacility) {
            console.warn(
                `      ${titleOf(u.formKey)}: ${u.count} record(s) with no derivable Facility`
            );
        }
    }
    if (ambiguousFacilities.length > 0) {
        console.warn(
            `      ambiguous facilities ((survey, orgUnit) matching >1 Facility): ${ambiguousFacilities.length}`
        );
    }
    for (const u of unresolvedWard) {
        console.warn(
            `      ${titleOf(u.formKey)}: ${
                u.count
            } record(s) whose ward is not on their facility's ward list`
        );
    }
    if (ambiguousFacilityCodes.length > 0) {
        console.warn(
            `      org units with conflicting Hospital IDs (ward statistics there have no Facility_code): ${ambiguousFacilityCodes.length}`
        );
    }
    if (unresolvedStageEvents.length > 0) {
        for (const u of unresolvedStageEvents) {
            console.warn(
                `      ${titleOf(u.formKey)}: ${u.count} event(s) on unresolvable stage ${
                    u.programStage
                } SKIPPED (data lost)`
            );
        }
    }
    for (const u of duplicateStageEvents) {
        console.warn(
            `      ${titleOf(u.formKey)}: ${u.count} extra event(s) on single-entry stage ${
                u.programStage
            }; ` + `their values overwrote the earlier event's`
        );
    }
    if (sheetNameCollisions.length > 0) {
        console.warn(`      sheet name collisions resolved: ${sheetNameCollisions.length}`);
    }
    if (unresolvedHeaders.length > 0) {
        console.warn(
            `      fields deleted from DHIS2 metadata (header shows the raw id): ${unresolvedHeaders.length}`
        );
        for (const h of unresolvedHeaders) {
            console.warn(`        ${titleOf(h.formKey)}: ${h.kind} ${h.id}`);
        }
    }
}

/**
 * Case report and the leaf forms have NO foreign key to Facility (see the note on
 * PARENT_BY_DEFAULT_UID). Facility is derived by matching on the pair
 * (Survey_id, org_unit_id) against the Facility-level form.
 *
 * Leaf forms inherit orgUnit from their Case report in the UI, but we match on each
 * record's own orgUnit, which is what the server actually stored.
 */
export function resolveFacilityIds(
    all: FormData[],
    facilityKey: string,
    report: IntegrityReport
): void {
    const facilityData = all.find(d => d.form.key === facilityKey);
    if (!facilityData) return;

    // (surveyId + orgUnit) -> facility record ids
    const index = new Map<string, string[]>();
    for (const facility of facilityData.records) {
        const composite = `${facility.surveyId}|${facility.orgUnit}`;
        const existing = index.get(composite);
        if (existing) existing.push(facility.id);
        else index.set(composite, [facility.id]);
    }

    for (const [composite, ids] of index) {
        if (ids.length > 1) {
            const [surveyId = "", orgUnit = ""] = composite.split("|");
            report.ambiguousFacilities.push({ surveyId, orgUnit, facilityIds: ids });
        }
    }

    for (const data of all) {
        if (data.form.key === facilityKey) {
            // A Facility record is its own facility.
            for (const record of data.records) record.facilityId = record.id;
            continue;
        }
        if (data.form.kind === "dataSet" || !data.form.parentKey) continue;

        let unresolved = 0;
        for (const record of data.records) {
            const matches = index.get(`${record.surveyId}|${record.orgUnit}`);
            // Ambiguous pairs are reported above; take the first for determinism.
            if (matches && matches[0]) record.facilityId = matches[0];
            else unresolved++;
        }
        if (unresolved > 0)
            report.unresolvedFacility.push({ formKey: data.form.key, count: unresolved });
    }
}

/** How many parent links lie between a sheet and its root; sorting by it puts parents first. */
function formDepth(data: FormData, byKey: Map<string, FormData>): number {
    const parent = data.form.parentKey ? byKey.get(data.form.parentKey) : undefined;
    return parent && parent !== data ? 1 + formDepth(parent, byKey) : 0;
}

const trimmed = (value: string | undefined) => (value ?? "").trim();

/** Cyrillic capitals that look exactly like Latin ones (Kyrgyz keyboards type "С3" for "C3"). */
const LATIN_LOOK_ALIKES: Record<string, string> = {
    А: "A",
    В: "B",
    Е: "E",
    К: "K",
    М: "M",
    Н: "H",
    О: "O",
    Р: "P",
    С: "C",
    Т: "T",
    Х: "X",
};

/**
 * A code as compared, so how it was typed does not count: case, spaces, leading zeros, a
 * trailing slash and Cyrillic look-alike letters ("hf025/ w1" = "HF025/W01", "HF025/" =
 * "HF025", Cyrillic "С3" = "C3"). On preprod (Oct 2026) most apparent mismatches were only that.
 */
export function codeKey(code: string): string {
    return code
        .toUpperCase()
        .replace(/[АВЕКМНОРСТХ]/g, letter => LATIN_LOOK_ALIKES[letter] ?? letter)
        .replace(/\s+/g, "")
        .replace(/(?<!\d)0+(?=\d)/g, "")
        .replace(/\/+$/, "");
}

/** A ward typed without its facility ("W16") written in full ("HF025/W16"), as ward lists are. */
export function fullWardCode(ward: string, facility: string): string {
    const bare = !ward.includes("/") && !codeKey(ward).startsWith(codeKey(facility));
    return ward && facility && bare ? `${facility}/${ward}` : ward;
}

/** The Facility form's repeatable "Ward data" sheet(s): one row per ward of a hospital. */
function facilityWardSheets(all: FormData[], facilityKey: string | undefined): FormData[] {
    if (!facilityKey) return [];
    return all.filter(
        d =>
            d.form.kind === "trackerStage" &&
            d.form.parentKey === facilityKey &&
            d.records.some(r => r.values.has(FACILITY_WARD_CODE_DATAELEMENT_ID))
    );
}

/**
 * Fills each record's readable codes (survey name, facility, ward and patient codes) and its
 * Ward_id. Needs Facility_id resolved first (resolveFacilityIds).
 *
 * - Survey name: looked up by Survey_id from the Survey sheet.
 * - Facility: its Hospital ID. Its ward-data rows: that, plus their own ward code.
 * - Case report: the facility, ward and patient codes typed on it. A ward typed without its
 *   facility ("W16", 412 Malawi case reports on preprod) is written in full (fullWardCode).
 * - Forms filled for a case report's patient: facility and ward from the case report (where
 *   the patient was admitted is the case report's to say), but their OWN patient code, so a
 *   typo there stays visible (see flagIdMismatches).
 * - Ward statistics: the Hospital ID of the Facility record at the same org unit, and the
 *   ward written as the forms write it (HF025 + W16 -> HF025/W16).
 *
 * Ward_id is derived like Facility_id, as the app stores no such link: the ward-data row of
 * the case report's facility whose ward code matches (by codeKey); forms below the case
 * report copy it.
 */
export function resolveReadableCodes(
    all: FormData[],
    recordIndex: Map<string, Map<string, Record_>>,
    facilityKey: string | undefined,
    report: IntegrityReport
): void {
    const byKey = new Map(all.map(d => [d.form.key, d]));
    const surveyData = all.find(d => d.form.defaultUid === PREVALENCE_SURVEY_FORM_ID);
    const surveyNames = new Map(
        (surveyData?.records ?? []).map(r => [
            r.id,
            trimmed(r.values.get(PREVALENCE_SURVEY_NAME_DATAELEMENT_ID)),
        ])
    );
    const parentOf = (data: FormData, record: Record_) =>
        data.form.parentKey
            ? recordIndex.get(data.form.parentKey)?.get(record.parentId)
            : undefined;

    const ordered = all
        .filter(d => d.form.kind !== "dataSet")
        .sort((a, b) => formDepth(a, byKey) - formDepth(b, byKey));

    for (const data of ordered) {
        const { form } = data;
        for (const record of data.records) {
            const own = (field: string) => trimmed(record.values.get(field));
            const survey = surveyNames.get(record.surveyId) ?? "";
            const parent = parentOf(data, record)?.codes ?? NO_CODES;

            if (form.kind === "trackerStage") {
                record.codes = {
                    ...parent,
                    ward:
                        fullWardCode(own(FACILITY_WARD_CODE_DATAELEMENT_ID), parent.facility) ||
                        parent.ward,
                };
            } else if (form.defaultUid === PREVALENCE_SURVEY_FORM_ID) {
                record.codes = { ...NO_CODES, survey };
            } else if (form.defaultUid === PREVALENCE_FACILITY_LEVEL_FORM_ID) {
                record.codes = {
                    ...NO_CODES,
                    survey,
                    facility: own(AMR_SURVEYS_PREVALENCE_TEA_HOSPITAL_ID),
                };
            } else if (form.defaultUid === PREVALENCE_CASE_REPORT_FORM_ID) {
                const facility = own(CASE_REPORT_FACILITY_CODE_TEA);
                record.codes = {
                    survey,
                    facility,
                    ward: fullWardCode(own(CASE_REPORT_WARD_CODE_TEA), facility),
                    patient: own(AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID),
                };
            } else {
                record.codes = {
                    ...parent,
                    survey,
                    patient: own(AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID),
                };
            }
        }
    }

    // (facility record id + ward code) -> ward-data record id.
    const wardSheets = facilityWardSheets(all, facilityKey);
    const wardIndex = new Map<string, string>();
    const facilitiesWithWards = new Set<string>();
    for (const ward of wardSheets.flatMap(d => d.records)) {
        if (!ward.codes?.ward) continue;
        facilitiesWithWards.add(ward.parentId);
        const key = `${ward.parentId}|${codeKey(ward.codes.ward)}`;
        if (!wardIndex.has(key)) wardIndex.set(key, ward.id);
    }
    for (const data of ordered) {
        if (wardSheets.includes(data)) continue;
        let unresolved = 0;
        for (const record of data.records) {
            if (data.form.defaultUid !== PREVALENCE_CASE_REPORT_FORM_ID) {
                record.wardId = parentOf(data, record)?.wardId ?? "";
                continue;
            }
            const ward = record.codes?.ward ?? "";
            record.wardId = (ward && wardIndex.get(`${record.facilityId}|${codeKey(ward)}`)) || "";
            if (ward && !record.wardId && facilitiesWithWards.has(record.facilityId)) unresolved++;
        }
        if (unresolved > 0)
            report.unresolvedWard.push({ formKey: data.form.key, count: unresolved });
    }

    // Ward statistics: org unit -> the Hospital IDs its Facility records give.
    const facilityCodes = new Map<string, Set<string>>();
    for (const facility of (facilityKey && byKey.get(facilityKey)?.records) || []) {
        if (!facility.codes?.facility) continue;
        const codes = facilityCodes.get(facility.orgUnit) ?? new Set<string>();
        codes.add(facility.codes.facility);
        facilityCodes.set(facility.orgUnit, codes);
    }
    const ambiguous = new Set<string>();
    for (const data of all.filter(d => d.form.kind === "dataSet")) {
        for (const record of data.records) {
            const codes = [...(facilityCodes.get(record.orgUnit) ?? [])];
            if (codes.length > 1) ambiguous.add(record.orgUnit);
            const [facility = ""] = codes.length === 1 ? codes : [];
            record.codes = {
                ...NO_CODES,
                facility,
                ward: facility ? fullWardCode(record.wardName ?? "", facility) : "",
            };
        }
    }
    for (const orgUnit of ambiguous) {
        const codes = [...(facilityCodes.get(orgUnit) ?? [])].sort();
        report.ambiguousFacilityCodes.push({ orgUnit, codes });
    }
}

/**
 * Flags records whose typed codes disagree, compared by codeKey (case, spaces, leading zeros
 * and a trailing slash do not count; a blank is never a mismatch):
 * - case report: its facility code vs its Facility record's Hospital ID; its ward vs that
 *   facility's ward list; and the nesting (ward = facility/..., patient = ward/...);
 * - forms filled for a case report's patient: their patient ID vs the case report's, and
 *   their own patient ID field (if any) vs their patient ID, with or without "/C3".
 *
 * Runs after flagRecords, so an ID MISMATCH does not mark every child of a case report as
 * PARENT FLAGGED: the DHIS2 links still hold, only the typed codes differ.
 */
export function flagIdMismatches(
    all: FormData[],
    recordIndex: Map<string, Map<string, Record_>>,
    facilityKey: string | undefined
): void {
    const byKey = new Map(all.map(d => [d.form.key, d]));
    const facilities = facilityKey ? recordIndex.get(facilityKey) : undefined;
    const wardsByFacility = new Map<string, Set<string>>();
    for (const ward of facilityWardSheets(all, facilityKey).flatMap(d => d.records)) {
        if (!ward.codes?.ward) continue;
        const wards = wardsByFacility.get(ward.parentId) ?? new Set<string>();
        wards.add(codeKey(ward.codes.ward));
        wardsByFacility.set(ward.parentId, wards);
    }
    const same = (a: string, b: string) => codeKey(a) === codeKey(b);
    const within = (code: string, parent: string) =>
        codeKey(code).startsWith(`${codeKey(parent)}/`);
    const mismatch = (record: Record_, detail: string) =>
        addFlag(record, { flag: "ID MISMATCH", detail });

    for (const data of all) {
        if (data.form.kind === "trackerStage" || data.form.kind === "dataSet") continue;
        const parent = data.form.parentKey ? byKey.get(data.form.parentKey) : undefined;
        const caseReports =
            parent?.form.defaultUid === PREVALENCE_CASE_REPORT_FORM_ID
                ? recordIndex.get(parent.form.key)
                : undefined;
        const isCaseReport = data.form.defaultUid === PREVALENCE_CASE_REPORT_FORM_ID;
        if (!isCaseReport && !caseReports) continue;

        for (const record of data.records) {
            const { facility, ward, patient } = record.codes ?? NO_CODES;
            if (caseReports) {
                const caseReport = caseReports.get(record.parentId);
                const expected = caseReport?.codes?.patient ?? "";
                if (patient && expected && !same(patient, expected)) {
                    mismatch(
                        record,
                        `Unique survey patient ID "${patient}" differs from its case report's "${expected}"`
                    );
                }
                const own = ownPatientId(record);
                if (own && patient && !same(own, patient) && !same(own, `${patient}/C3`)) {
                    mismatch(
                        record,
                        `This form's own patient ID field "${own}" is neither its Unique survey patient ID "${patient}" nor that + /C3`
                    );
                }
                continue;
            }

            const hospitalId = facilities?.get(record.facilityId)?.codes?.facility ?? "";
            if (facility && hospitalId && !same(facility, hospitalId)) {
                mismatch(
                    record,
                    `Unique facility ID "${facility}" differs from its facility's on the Facility form ("${hospitalId}")`
                );
            }
            const wards = wardsByFacility.get(record.facilityId);
            if (ward && wards && !wards.has(codeKey(ward))) {
                mismatch(
                    record,
                    `Unique ward ID "${ward}" is not among its facility's wards on the Facility form`
                );
            }
            if (facility && ward && !within(ward, facility)) {
                mismatch(
                    record,
                    `Unique ward ID "${ward}" does not start with its Unique facility ID "${facility}/"`
                );
            }
            if (ward && patient && !within(patient, ward)) {
                mismatch(
                    record,
                    `Unique survey patient ID "${patient}" does not start with its Unique ward ID "${ward}/"`
                );
            }
        }
    }
}

/** The form's own patient ID field (see OWN_PATIENT_ID_TEAS), trimmed; "" if none. */
function ownPatientId(record: Record_): string {
    for (const id of OWN_PATIENT_ID_TEAS) {
        const value = trimmed(record.values.get(id));
        if (value) return value;
    }
    return "";
}

/** What DHIS2 says about an id that records point at but this extract does not contain. */
export type ReferenceStatus =
    | { status: "deleted"; lastUpdated: string }
    /** Exists and is not deleted, under `orgUnit` (a display name). */
    | { status: "elsewhere"; orgUnit: string };

/** Looks up ids in DHIS2; an id missing from the result does not exist there. */
export type ReferenceLookup = (ids: {
    surveys: string[];
    trackedEntities: string[];
}) => Promise<Map<string, ReferenceStatus>>;

const isUid = (id: string) => UID_RE.test(id);

function referenceFlag(
    what: string,
    id: string,
    status: ReferenceStatus | undefined,
    isSurvey: boolean
): RecordFlag {
    if (status?.status === "deleted") {
        return {
            flag: "PARENT DELETED",
            detail: `${what} ${id} was deleted in DHIS2 (last changed ${status.lastUpdated.slice(
                0,
                10
            )})`,
        };
    }
    if (status?.status === "elsewhere") {
        return {
            flag: "OUTSIDE EXTRACT",
            detail: `${what} ${id} exists in DHIS2 under ${status.orgUnit}, outside this extract`,
        };
    }
    return isSurvey
        ? { flag: "TEST/INVALID", detail: `Survey record ID "${id}" is not a survey in DHIS2` }
        : { flag: "PARENT MISSING", detail: `${what} "${id}" does not exist in DHIS2` };
}

function addFlag(record: Record_, flag: RecordFlag): void {
    if (!record.flags.some(f => f.flag === flag.flag && f.detail === flag.detail))
        record.flags.push(flag);
}

/**
 * Flags the records epidemiologists should look at twice: test or invalid survey ids,
 * records whose parent was deleted in DHIS2 (children are not deleted with it), parents that
 * never existed or sit outside the extract, survey mismatches, and records whose parent is
 * itself flagged. Every dangling id is looked up in one batch, so "deleted" is told apart
 * from "never existed". Parents are flagged before their children, so flags propagate down.
 *
 * The Survey_id check needs the Survey form in the run (without it every id would look
 * unknown); a parent link is checked only when the parent form was extracted.
 */
export async function flagRecords(
    all: FormData[],
    recordIndex: Map<string, Map<string, Record_>>,
    lookUp: ReferenceLookup
): Promise<void> {
    const byKey = new Map(all.map(d => [d.form.key, d]));
    const survey = all.find(d => d.form.defaultUid === PREVALENCE_SURVEY_FORM_ID);
    const surveys = survey && recordIndex.get(survey.form.key);

    const checks = all
        .filter(data => data.form.kind !== "dataSet" && data !== survey)
        .map(data => {
            const parent = data.form.parentKey ? byKey.get(data.form.parentKey) : undefined;
            return {
                data,
                // A repeatable-stage row carries its owner's Survey_id; the owner's check covers it.
                checkSurvey: !!surveys && data.form.kind !== "trackerStage",
                // Where the parent IS the Survey, the Survey_id check already covers the link.
                parent: parent && parent !== survey ? parent : undefined,
            };
        })
        .sort((a, b) => formDepth(a.data, byKey) - formDepth(b.data, byKey));

    const danglingSurveys = new Set<string>();
    const danglingParents = new Set<string>();
    for (const { data, checkSurvey, parent } of checks) {
        const parents = parent && recordIndex.get(parent.form.key);
        for (const record of data.records) {
            if (checkSurvey && record.surveyId && !surveys?.has(record.surveyId)) {
                danglingSurveys.add(record.surveyId);
            }
            if (parents && record.parentId && !parents.has(record.parentId))
                danglingParents.add(record.parentId);
        }
    }
    const statuses =
        danglingSurveys.size + danglingParents.size > 0
            ? await lookUp({
                  surveys: [...danglingSurveys].filter(isUid),
                  trackedEntities: [...danglingParents].filter(isUid),
              })
            : new Map<string, ReferenceStatus>();

    for (const { data, checkSurvey, parent } of checks) {
        const parents = parent && recordIndex.get(parent.form.key);
        for (const record of data.records) {
            if (checkSurvey) {
                if (!record.surveyId)
                    addFlag(record, {
                        flag: "TEST/INVALID",
                        detail: "No Survey record ID recorded",
                    });
                else if (!surveys?.has(record.surveyId)) {
                    addFlag(
                        record,
                        referenceFlag(
                            "Survey",
                            record.surveyId,
                            statuses.get(record.surveyId),
                            true
                        )
                    );
                }
            }
            if (!parent || !parents) continue;

            const parentName = parent.form.title;
            const parentRecord = record.parentId ? parents.get(record.parentId) : undefined;
            if (!record.parentId) {
                addFlag(record, {
                    flag: "PARENT MISSING",
                    detail: `No ${parentName} record ID recorded`,
                });
            } else if (!parentRecord) {
                addFlag(
                    record,
                    referenceFlag(parentName, record.parentId, statuses.get(record.parentId), false)
                );
            } else {
                if (
                    data.form.kind !== "trackerStage" &&
                    record.surveyId &&
                    parentRecord.surveyId &&
                    record.surveyId !== parentRecord.surveyId
                ) {
                    addFlag(record, {
                        flag: "SURVEY MISMATCH",
                        detail: `Survey record ID ${record.surveyId}, but its ${parentName} ${parentRecord.id} has ${parentRecord.surveyId}`,
                    });
                }
                if (parentRecord.flags.length > 0) {
                    const kinds = [...new Set(parentRecord.flags.map(f => f.flag))].join(", ");
                    addFlag(record, {
                        flag: "PARENT FLAGGED",
                        detail: `${parentName} ${parentRecord.id} is flagged: ${kinds}`,
                    });
                }
            }
        }
    }
}

/** Flagged-record counts per sheet and flag, for _index and the console. */
export function summariseFlags(
    all: FormData[]
): { sheet: string; flag: FlagKind; count: number }[] {
    const counts = new Map<string, { sheet: string; flag: FlagKind; count: number }>();
    for (const data of all) {
        for (const record of data.records) {
            for (const flag of new Set(record.flags.map(f => f.flag))) {
                const key = `${data.form.key}|${flag}`;
                const row = counts.get(key) ?? { sheet: data.form.title, flag, count: 0 };
                row.count++;
                counts.set(key, row);
            }
        }
    }
    return [...counts.values()];
}

/** Ids per tracker lookup request. */
const LOOKUP_BATCH = 50;

/**
 * Asks DHIS2 about ids records point at but the extract does not contain, deleted records
 * included, so the flags can say "deleted" rather than just "missing".
 */
async function lookUpReferences(
    api: D2Api,
    session: SessionManager,
    ids: { surveys: string[]; trackedEntities: string[] }
): Promise<Map<string, ReferenceStatus>> {
    type Row = { deleted?: boolean; orgUnit?: string; updatedAt?: string };
    const found = new Map<string, Row>();

    const query = async (
        path: string,
        idParam: string,
        idField: "event" | "trackedEntity",
        list: string[]
    ) => {
        for (let i = 0; i < list.length; i += LOOKUP_BATCH) {
            const batch = list.slice(i, i + LOOKUP_BATCH);
            const resp = await session.retryWithBackoff(() =>
                api
                    .get<{
                        [key: string]:
                            | (Row & { event?: string; trackedEntity?: string })[]
                            | undefined;
                    }>(path, {
                        [idParam]: batch.join(","),
                        includeDeleted: true,
                        ouMode: "ACCESSIBLE",
                        fields: `${idField},deleted,orgUnit,updatedAt`,
                        pageSize: batch.length,
                    })
                    .getData()
            );
            for (const row of resp[idParam] ?? resp.instances ?? []) {
                const id = row[idField];
                if (id) found.set(id, row);
            }
        }
    };
    await query("/tracker/events", "events", "event", ids.surveys);
    await query(
        "/tracker/trackedEntities",
        "trackedEntities",
        "trackedEntity",
        ids.trackedEntities
    );

    const elsewhere = [...found.values()]
        .filter(r => !r.deleted && r.orgUnit)
        .map(r => r.orgUnit as string);
    const names = await fetchOrgUnitNames(api, session, [...new Set(elsewhere)]);

    const statuses = new Map<string, ReferenceStatus>();
    for (const [id, row] of found) {
        statuses.set(
            id,
            row.deleted
                ? { status: "deleted", lastUpdated: row.updatedAt ?? "" }
                : {
                      status: "elsewhere",
                      orgUnit: names.get(row.orgUnit ?? "") ?? row.orgUnit ?? "?",
                  }
        );
    }
    return statuses;
}

/** True for Case report and every sheet below it: the sheets with a patient's ward. */
function isCaseReportOrBelow(form: ResolvedForm, byKey: Map<string, FormData>): boolean {
    const seen = new Set<string>();
    for (
        let current: ResolvedForm | undefined = form;
        current && !seen.has(current.key);
        current = current.parentKey ? byKey.get(current.parentKey)?.form : undefined
    ) {
        if (current.defaultUid === PREVALENCE_CASE_REPORT_FORM_ID) return true;
        seen.add(current.key);
    }
    return false;
}

/** What one row of a sheet is, which decides its identification columns. */
type SheetRole = "survey" | "facility" | "wards" | "caseReport" | "patientForm" | "wardStatistics";

function sheetRole(form: ResolvedForm, byKey: Map<string, FormData>): SheetRole {
    if (form.kind === "dataSet") return "wardStatistics";
    if (form.defaultUid === PREVALENCE_SURVEY_FORM_ID) return "survey";
    if (form.defaultUid === PREVALENCE_FACILITY_LEVEL_FORM_ID) return "facility";
    if (form.defaultUid === PREVALENCE_CASE_REPORT_FORM_ID) return "caseReport";
    return isCaseReportOrBelow(form, byKey) ? "patientForm" : "wards";
}

/**
 * The four column groups of every form sheet, left to right. Identification and data check
 * stay on screen while scrolling; the DHIS2 linking and system group starts collapsed.
 */
export type ColumnGroup = "identification" | "check" | "form" | "system";

export const COLUMN_GROUPS: Record<ColumnGroup, { name: string; fill: string }> = {
    identification: { name: "Identification", fill: "FFBDD7EE" },
    check: { name: "Data check", fill: "FFF8CBAD" },
    form: { name: "Form question", fill: "FFE2EFDA" },
    system: { name: "DHIS2 linking and system", fill: "FFD9D9D9" },
};

/** Every other form section gets this shade instead, so sections show as bands. */
const ALTERNATE_SECTION_FILL = "FFFFF2CC";

/** One column of a form sheet: its header, its group, and where its value comes from. */
export type SheetColumn = {
    header: string;
    group: ColumnGroup;
    /** For form questions: the form section, which bands the header colours. */
    section?: string;
    /** Where the value comes from, in plain words: the header note and the Column guide. */
    about: string;
    valueType?: string;
    get: (record: Record_) => string;
};

/** The DHIS2 system columns of each kind of sheet, as the record builders fill `meta`. */
const META_KEYS_BY_KIND: Record<FormKind, readonly string[]> = {
    tracker: ["created_at", "updated_at", "enrolled_at", "status", "program"],
    trackerStage: ["occurred_at", "status", "program"],
    event: ["occurred_at", "created_at", "updated_at", "status", "program"],
    dataSet: ["last_updated", "stored_by"],
};

const META_COLUMNS: Record<string, { header: string; about: string }> = {
    created_at: { header: "Date entered", about: "When the record was first saved in DHIS2." },
    updated_at: { header: "Last changed", about: "When the record was last changed in DHIS2." },
    last_updated: { header: "Last changed", about: "When the value was last changed in DHIS2." },
    enrolled_at: { header: "Enrolled on", about: "The record's enrolment date in DHIS2." },
    occurred_at: { header: "Event date", about: "The date DHIS2 holds for this form." },
    status: { header: "Status", about: "DHIS2 status: ACTIVE (open) or COMPLETED." },
    program: {
        header: "Form version",
        about: "The DHIS2 program the row comes from: the default form or a country's custom version of it.",
    },
    stored_by: { header: "Entered by", about: "The DHIS2 user who saved the value." },
};

/** Meta columns holding DHIS2 timestamps, written as real date-times. */
const META_DATETIME_KEYS = new Set([
    "created_at",
    "updated_at",
    "enrolled_at",
    "occurred_at",
    "last_updated",
]);

const DATASET_COLUMN_ABOUT: Record<string, string> = {
    period: "The period the statistics are for.",
    ward: "The ward (and, on Ward summary statistics, the specialty) the statistics are for.",
    data_element: "The statistic.",
    disaggregation: "Its breakdown, where it has one.",
    value: "The value.",
};

/**
 * The link columns, in the DHIS2 linking and system group. Survey record ID is read from the
 * record's own survey-link field; Facility record ID is worked out from the survey and
 * facility, Ward record ID from that and the Unique ward ID (resolveFacilityIds,
 * resolveReadableCodes); the parent's record ID is added when the parent is not the Survey.
 */
export function linkColumnsFor(form: ResolvedForm, byKey: Map<string, FormData>): SheetColumn[] {
    if (form.kind === "dataSet") return [];
    const role = sheetRole(form, byKey);
    const link = (header: string, about: string, get: (r: Record_) => string): SheetColumn => ({
        header,
        group: "system",
        about,
        get,
    });
    const cols: SheetColumn[] = [];

    if (role !== "survey") {
        cols.push(
            link(
                "Survey record ID",
                "DHIS2 id of the survey: the Record ID of its row on the Survey sheet. Read from the form's Survey ID field.",
                r => r.surveyId
            )
        );
    }
    if (role !== "survey" && role !== "facility") {
        cols.push(
            link(
                "Facility record ID",
                "The Record ID of this facility's row on the Facility sheet, for this survey. Worked out by the extract from the survey and facility: the app stores no such link.",
                r => r.facilityId
            )
        );
    }
    if (role === "caseReport" || role === "patientForm") {
        cols.push(
            link(
                "Ward record ID",
                "The Record ID of the patient's ward on the Facility - Ward data sheet. Worked out by the extract from the facility and the case report's Unique ward ID.",
                r => r.wardId ?? ""
            )
        );
    }
    // A Facility stage's parent IS its facility: Facility record ID already says so.
    const parent = form.parentKey ? byKey.get(form.parentKey)?.form : undefined;
    if (parent && parent.defaultUid !== PREVALENCE_SURVEY_FORM_ID && role !== "wards") {
        cols.push(
            link(
                `${parent.title} record ID`,
                `The Record ID of the ${parent.title} row this record belongs to.`,
                r => r.parentId
            )
        );
    }
    return cols;
}

/** Fields shown in the identification group or the link columns, so not again as questions. */
function fieldsShownElsewhere(form: ResolvedForm, role: SheetRole): Set<string> {
    const moved: Record<SheetRole, string[]> = {
        survey: [PREVALENCE_SURVEY_NAME_DATAELEMENT_ID],
        facility: [AMR_SURVEYS_PREVALENCE_TEA_HOSPITAL_ID],
        wards: [FACILITY_WARD_CODE_DATAELEMENT_ID],
        caseReport: [
            CASE_REPORT_FACILITY_CODE_TEA,
            CASE_REPORT_WARD_CODE_TEA,
            AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID,
        ],
        patientForm:
            form.kind === "trackerStage" ? [] : [AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID],
        wardStatistics: [],
    };
    const links = [form.surveyLinkField, ...form.parentLinkField.split("; ")];
    return new Set([...moved[role], ...links].filter(Boolean));
}

const FROM_CASE_REPORT_SUFFIX = " (from case report)";
const OWN_FIELD_SUFFIX = " (this form's own field)";

/** The identification group of a sheet: what a reader needs to know which record a row is. */
function identificationColumns(role: SheetRole, orgUnitNames: Map<string, string>): SheetColumn[] {
    const id = (header: string, about: string, get: (r: Record_) => string): SheetColumn => ({
        header,
        group: "identification",
        about,
        get,
    });
    const place = (header: string, about: string) =>
        id(header, about, r => orgUnitNames.get(r.orgUnit) ?? "");
    const fromCase = role === "patientForm";
    const fromCaseSuffix = fromCase ? FROM_CASE_REPORT_SUFFIX : "";
    const completed = "A ward typed without its facility (W16) is shown in full (HF025/W16).";

    const surveyName = id(
        "Survey name",
        role === "survey"
            ? `The survey's name, as typed on the Survey form (SurveyName, ${PREVALENCE_SURVEY_NAME_DATAELEMENT_ID}).`
            : "The name of the survey this record belongs to, from the Survey sheet. Filter it to keep one survey.",
        r => r.codes?.survey ?? ""
    );
    const facilityName = place("Facility name", "The facility the record was entered under.");
    const facilityId = id(
        `Unique facility ID${fromCaseSuffix}`,
        {
            survey: "",
            facility: `As typed on the Facility form, where the field is called "Hospital ID" (${AMR_SURVEYS_PREVALENCE_TEA_HOSPITAL_ID}).`,
            wards: `The facility's Unique facility ID ("Hospital ID" on the Facility form).`,
            caseReport: `As typed on the case report (Unique facility ID, ${CASE_REPORT_FACILITY_CODE_TEA}).`,
            patientForm: "Copied from the patient's case report.",
            wardStatistics:
                'The Unique facility ID ("Hospital ID") on this facility\'s Facility form.',
        }[role],
        r => r.codes?.facility ?? ""
    );
    const wardId = id(
        `Unique ward ID${fromCaseSuffix}`,
        {
            survey: "",
            facility: "",
            wards: `As typed in the Facility form's Ward data (Unique ward ID, ${FACILITY_WARD_CODE_DATAELEMENT_ID}). ${completed}`,
            caseReport: `As typed on the case report (Unique ward/department ID, ${CASE_REPORT_WARD_CODE_TEA}). ${completed}`,
            patientForm: "Copied from the patient's case report.",
            wardStatistics:
                "The facility's Unique facility ID + / + the ward of the statistics (e.g. HF025/W16).",
        }[role],
        r => r.codes?.ward ?? ""
    );
    const patientId = id(
        "Unique survey patient ID",
        role === "caseReport"
            ? `As typed on the case report (${AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID}).`
            : `As typed on this form (${AMR_SURVEYS_PREVALENCE_TEA_UNIQUE_PATIENT_ID}). It should match the case report's; a difference is a data check.`,
        r => r.codes?.patient ?? ""
    );

    switch (role) {
        case "survey":
            return [surveyName, place("Country", "The country the survey is registered in.")];
        case "facility":
            return [surveyName, facilityName, facilityId];
        case "wards":
            return [surveyName, facilityName, facilityId, wardId];
        case "caseReport":
        case "patientForm":
            return [surveyName, facilityName, facilityId, wardId, patientId];
        case "wardStatistics":
            return [facilityName, facilityId, wardId];
    }
}

const CHECK_COLUMNS: SheetColumn[] = [
    {
        header: "Data check",
        group: "check",
        about: "Warnings the extract adds, e.g. test data, a parent record deleted or missing, IDs that disagree. Empty means no warning. The Read me sheet explains each one.",
        get: r => [...new Set(r.flags.map(f => f.flag))].join("; "),
    },
    {
        header: "Data check details",
        group: "check",
        about: "Why the row has a warning.",
        get: r => r.flags.map(f => f.detail).join("; "),
    },
];

/**
 * Every column of a form sheet, left to right: identification, data check, the form's
 * questions in form order (fields already shown as identification or link columns are not
 * repeated), then DHIS2 linking and system. The sheet writer, the Column guide and
 * discovery's forecast all use this, so they always agree.
 */
export function sheetColumns(
    data: FormData,
    byKey: Map<string, FormData>,
    orgUnitNames: Map<string, string> = new Map()
): SheetColumn[] {
    const { form } = data;
    const role = sheetRole(form, byKey);
    const identification = identificationColumns(role, orgUnitNames);

    const system: SheetColumn[] = [
        {
            header: "Record ID",
            group: "system",
            about: "This row's id in DHIS2. Other sheets point at it in their record ID columns.",
            get: r => r.id,
        },
        ...linkColumnsFor(form, byKey),
        {
            header: "DHIS2 org unit ID",
            group: "system",
            about: "DHIS2's id of the facility (or country) the record was entered under.",
            get: r => r.orgUnit,
        },
        ...META_KEYS_BY_KIND[form.kind].map(
            (key): SheetColumn => ({
                ...(META_COLUMNS[key] ?? { header: key, about: "" }),
                group: "system",
                valueType: META_DATETIME_KEYS.has(key) ? "DATETIME" : undefined,
                get: r => r.meta.get(key) ?? "",
            })
        ),
    ];

    // A form's own copy of an identification field (the follow-up form's "Unique facility
    // ID") is told apart from the identification column it would otherwise look like.
    const hidden = fieldsShownElsewhere(form, role);
    const idNames = new Set(identification.map(c => c.header.replace(FROM_CASE_REPORT_SUFFIX, "")));
    const shown = new Map(
        [...data.columns]
            .filter(([key]) => {
                const id = key.startsWith(STAGE_COLUMN_PREFIX)
                    ? key.slice(STAGE_COLUMN_PREFIX.length)
                    : key;
                return !hidden.has(id);
            })
            .map(([key, label]) => [
                key,
                idNames.has(label) ? `${label}${OWN_FIELD_SUFFIX}` : label,
            ])
    );
    const dhis2Names = new Map(
        [...(data.columnInfo ?? [])].map(([key, info]) => [key, info.dhis2Name])
    );
    const reserved = new Set([...identification, ...CHECK_COLUMNS, ...system].map(c => c.header));
    const questions = [...uniqueLabels(shown, dhis2Names, reserved)].map(
        ([key, header]): SheetColumn => {
            const info = data.columnInfo?.get(key);
            const about =
                form.kind === "dataSet"
                    ? DATASET_COLUMN_ABOUT[key] ?? ""
                    : info?.dhis2Name
                    ? `${info.section ? `${info.section}. ` : ""}DHIS2 field: ${info.dhis2Name} (${
                          info.id
                      }).`
                    : "No longer on the form; values entered before it was removed are kept.";
            return {
                header,
                group: "form",
                section: form.kind === "dataSet" ? "Ward statistics" : info?.section ?? "",
                about,
                valueType: data.valueTypes?.get(key),
                get: r => r.values.get(key) ?? "",
            };
        }
    );

    return [...identification, ...CHECK_COLUMNS, ...questions, ...system];
}

/** Beyond 15 significant digits Excel silently rounds a number, so such values stay text. */
const EXCEL_MAX_DIGITS = 15;

/**
 * A stored value as an Excel cell: a real number or date for numeric/date fields, so they
 * can be summed and filtered, and the text unchanged for everything else (UIDs and coded
 * values must never be re-parsed). A value that does not convert exactly stays text.
 */
export function toCellValue(raw: string, valueType: string | undefined): string | number | Date {
    if (raw === "" || !valueType) return raw;

    if (NUMERIC_VALUE_TYPES.has(valueType)) {
        const n = Number(raw);
        const digits = raw.replace(/[^0-9]/g, "").replace(/^0+/, "").length;
        return Number.isFinite(n) && digits <= EXCEL_MAX_DIGITS ? n : raw;
    }
    if (valueType === "DATE" || valueType === "DATETIME") {
        // DHIS2 dates carry no zone. Read them as UTC, which is how Excel serials are
        // written, so the cell shows exactly the stored date/time.
        const hasZone = /(Z|[+-]\d\d:?\d\d)$/i.test(raw);
        const iso =
            valueType === "DATE" ? `${raw.slice(0, 10)}T00:00:00Z` : hasZone ? raw : `${raw}Z`;
        const date = new Date(iso);
        return Number.isNaN(date.getTime()) ? raw : date;
    }
    return raw;
}

function columnNumFmt(valueType: string | undefined): string {
    if (valueType === "DATE") return "yyyy-mm-dd";
    if (valueType === "DATETIME") return "yyyy-mm-dd hh:mm";
    return valueType && NUMERIC_VALUE_TYPES.has(valueType) ? "General" : "@";
}

/** Light orange: flagged rows stand out without hiding their content. */
const FLAG_FILL: Excel.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFD8A8" } };

const solidFill = (argb: string): Excel.Fill => ({
    type: "pattern",
    pattern: "solid",
    fgColor: { argb },
});

/** Header colour of each column: its group's, with the form's sections in alternating bands. */
export function headerFills(columns: SheetColumn[]): string[] {
    let band = 0;
    return columns.map((column, i) => {
        if (column.group !== "form") return COLUMN_GROUPS[column.group].fill;
        const previous = columns[i - 1];
        if (previous?.group === "form" && previous.section !== column.section) band++;
        return band % 2 === 0 ? COLUMN_GROUPS.form.fill : ALTERNATE_SECTION_FILL;
    });
}

type Writer = Excel.stream.xlsx.WorkbookWriter;

/**
 * Streams one form sheet (columns: sheetColumns). Headers are coloured by group and carry a
 * note saying where the value comes from; identification and data check stay on screen while
 * scrolling right; the DHIS2 linking and system group starts collapsed. Flagged rows are shaded.
 */
export function writeFormSheet(
    workbook: Writer,
    data: FormData,
    byKey: Map<string, FormData>,
    orgUnitNames: Map<string, string>,
    sheetName: string
): void {
    const { form, records } = data;
    const columns = sheetColumns(data, byKey, orgUnitNames);
    const frozen = columns.filter(c => c.group === "identification" || c.group === "check").length;

    const sheet = workbook.addWorksheet(sheetName, {
        views: [{ state: "frozen", xSplit: frozen, ySplit: 1 }],
        properties: { outlineLevelCol: 1 },
    });
    // Streaming writes columns with the first row, so formats are set first, at column level.
    // Text by default, so DHIS2 UIDs and coded values are never re-parsed by Excel as numbers
    // or dates if the sheet is edited.
    sheet.columns = columns.map(c => ({
        width: c.group === "form" ? 24 : 20,
        style: { numFmt: columnNumFmt(c.valueType) },
        ...(c.group === "system" ? { outlineLevel: 1, hidden: true } : {}),
    }));
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
    const headerRow = sheet.addRow(columns.map(c => c.header));
    headerRow.font = { bold: true };
    headerRow.height = 48;
    const fills = headerFills(columns);
    columns.forEach((column, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.fill = solidFill(fills[i] ?? COLUMN_GROUPS.form.fill);
        cell.alignment = { wrapText: true, vertical: "top" };
        cell.note = `${COLUMN_GROUPS[column.group].name}. ${column.about}`;
    });
    headerRow.commit();

    if (records.length + 1 > EXCEL_MAX_ROWS) {
        console.warn(
            `  ! ${form.key}: ${records.length} rows exceeds Excel's sheet limit; only the first ` +
                `${EXCEL_MAX_ROWS - 1} are written. Narrow the scope (e.g. a smaller --org-unit) ` +
                `to extract the rest.`
        );
    }

    for (const record of records.slice(0, EXCEL_MAX_ROWS - 1)) {
        // An empty value writes no cell at all: a truly blank cell, and a smaller file.
        const row = sheet.addRow(
            columns.map(c => {
                const value = c.get(record);
                return value === "" ? null : toCellValue(value, c.valueType);
            })
        );
        if (record.flags.length > 0) {
            for (let column = 1; column <= columns.length; column++)
                row.getCell(column).fill = FLAG_FILL;
        }
        row.commit();
    }
    sheet.commit();
}

/**
 * A data dictionary: one row per column of every form sheet, with its group, form section,
 * where its value comes from and how many rows fill it.
 */
export function writeColumnGuideSheet(
    workbook: Writer,
    all: FormData[],
    byKey: Map<string, FormData>,
    orgUnitNames: Map<string, string>,
    sheetNames: Map<string, string>
): void {
    const sheet = workbook.addWorksheet(COLUMN_GUIDE_SHEET, {
        views: [{ state: "frozen", ySplit: 1 }],
    });
    sheet.columns = [24, 40, 24, 30, 90, 14].map(width => ({ width }));
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 6 } };
    const header = sheet.addRow([
        "Sheet",
        "Column",
        "Group",
        "Form section",
        "What it is / where it comes from",
        "Rows filled",
    ]);
    header.font = { bold: true };
    header.commit();

    for (const data of all) {
        const columns = sheetColumns(data, byKey, orgUnitNames);
        const fills = headerFills(columns);
        columns.forEach((column, i) => {
            const filled = data.records.filter(r => column.get(r) !== "").length;
            const row = sheet.addRow([
                sheetNames.get(data.form.key) ?? data.form.title,
                column.header,
                COLUMN_GROUPS[column.group].name,
                column.section ?? "",
                column.about,
                `${filled} of ${data.records.length}`,
            ]);
            row.getCell(2).fill = solidFill(fills[i] ?? COLUMN_GROUPS.form.fill);
            row.commit();
        });
    }
    sheet.commit();
}

/**
 * Machine-readable relationship contract: one row per sheet giving its key, the sheet it
 * belongs to, the column that links them, the other link columns, cardinality and an example
 * join. Downstream tools (Power BI, SQL loaders) can read this instead of hard-coding it.
 */
export function writeJoinsSheet(
    workbook: Writer,
    all: FormData[],
    facilityKey: string | undefined,
    sheetNames: Map<string, string>
): void {
    const sheet = workbook.addWorksheet(JOINS_SHEET);
    [26, 12, 22, 26, 52, 34, 24, 70].forEach((width, i) => (sheet.getColumn(i + 1).width = width));
    const byKey = new Map(all.map(d => [d.form.key, d]));
    const nameOf = (form: ResolvedForm) => sheetNames.get(form.key) ?? form.title;

    sheet.addRow(["How the sheets join"]).font = { bold: true, size: 14 };
    sheet.addRow([
        "Note",
        "Case report has NO link to Facility in DHIS2: it links to Survey. Facility record ID is " +
            "worked out by the extract, by matching the survey and the facility (org unit).",
    ]);
    sheet.addRow([]);

    sheet.addRow([
        "Sheet",
        "Key",
        "Belongs to",
        "Linked by (column here)",
        "All link columns",
        "Rows per parent",
        "Stored in DHIS2 field",
        "Example join",
    ]).font = { bold: true };

    for (const { form } of all) {
        const role = sheetRole(form, byKey);
        const parentForm = form.parentKey ? byKey.get(form.parentKey)?.form : undefined;
        const links = linkColumnsFor(form, byKey).map(c => c.header);

        let linkedBy = "";
        let cardinality = "";
        let exampleJoin = "";
        let sourceField = form.parentLinkField || "-";
        if (role === "wardStatistics") {
            linkedBy = "DHIS2 org unit ID, Unique ward ID";
            cardinality = "one row per statistic x breakdown x period x facility x ward";
            exampleJoin = facilityKey
                ? `'${nameOf(form)}'[DHIS2 org unit ID] = '${
                      sheetNames.get(facilityKey) ?? facilityKey
                  }'[DHIS2 org unit ID]`
                : "-";
            sourceField = "Ward = the value's attribute option combo";
        } else if (role === "survey") {
            linkedBy = "(top level)";
            cardinality = "-";
            exampleJoin = "-";
            sourceField = "-";
        } else if (parentForm) {
            linkedBy =
                parentForm.defaultUid === PREVALENCE_SURVEY_FORM_ID
                    ? "Survey record ID"
                    : role === "wards"
                    ? "Facility record ID"
                    : `${parentForm.title} record ID`;
            cardinality = `one ${parentForm.title} -> many ${form.title}`;
            exampleJoin = `'${nameOf(form)}'[${linkedBy}] = '${nameOf(parentForm)}'[Record ID]`;
        }

        sheet.addRow([
            nameOf(form),
            "Record ID",
            parentForm ? nameOf(parentForm) : role === "wardStatistics" ? "(none)" : "(top level)",
            linkedBy,
            links.join(", ") || "-",
            cardinality,
            sourceField,
            exampleJoin,
        ]);
    }

    sheet.addRow([]);
    sheet.addRow(["Worked-out link", "Rule"]).font = { bold: true };
    sheet.addRow([
        "Survey record ID",
        "Read from each record's own Survey ID field: every record traces to its survey directly.",
    ]);
    const facilitySheet = facilityKey && (sheetNames.get(facilityKey) ?? facilityKey);
    sheet.addRow([
        "Facility record ID",
        facilitySheet
            ? `= '${facilitySheet}'[Record ID] WHERE '${facilitySheet}'[Survey record ID] = row's Survey record ID AND '${facilitySheet}'[DHIS2 org unit ID] = row's DHIS2 org unit ID`
            : "(Facility sheet not extracted)",
    ]);
    const wardData = facilityWardSheets(all, facilityKey)[0]?.form;
    const wardSheet = wardData && nameOf(wardData);
    sheet.addRow([
        "Ward record ID",
        wardSheet
            ? `Case report: = '${wardSheet}'[Record ID] WHERE '${wardSheet}'[Facility record ID] = row's Facility record ID AND '${wardSheet}'[Unique ward ID] = row's Unique ward ID (ignoring case, spaces, leading zeros, a trailing slash and Cyrillic look-alike letters). Forms below the case report copy their case report's.`
            : "(Facility ward data not extracted)",
    ]);
    sheet.commit();
}

/**
 * Plain-language guide to the workbook, for the top of the Read me sheet. Only sheets present
 * are described.
 */
export function howTheSheetsLink(
    all: FormData[],
    sheetNames: Map<string, string> = new Map()
): [string, string][] {
    const nameOf = (form: ResolvedForm) => sheetNames.get(form.key) ?? form.title;
    const find = (defaultUid: string) => all.find(d => d.form.defaultUid === defaultUid)?.form;
    const survey = find(PREVALENCE_SURVEY_FORM_ID);
    const facility = find(PREVALENCE_FACILITY_LEVEL_FORM_ID);
    const caseReport = find(PREVALENCE_CASE_REPORT_FORM_ID);
    const wards = facilityWardSheets(all, facility?.key)[0]?.form;
    const patientForms = caseReport
        ? all
              .filter(d => d.form.parentKey === caseReport.key && d.form.kind !== "trackerStage")
              .map(d => nameOf(d.form))
        : [];
    const wardStatistics = all.filter(d => d.form.kind === "dataSet").map(d => nameOf(d.form));
    const caseSheet = caseReport ? nameOf(caseReport) : "Case report";

    const lines: [string, string][] = [
        [
            "Colours",
            "Headers are coloured by group. Blue: identification (which survey, facility, ward and " +
                "patient). Orange: data check. Green and yellow: the form's questions, in form order, " +
                "one shade per form section. Grey: DHIS2 linking and system columns, collapsed; click " +
                "+ above the columns to show them. Hover over a header to see where its value comes " +
                "from; the Column guide sheet lists every column.",
        ],
        [
            "Complete",
            "Every question on the form has a column, even if nobody answered it, and every form " +
                "has a sheet, even if it has no records.",
        ],
        [
            "Two kinds of ID",
            "The identification columns hold the IDs the survey teams typed (Survey name, Unique " +
                "facility ID, Unique ward ID, Unique survey patient ID): use them to read and filter. " +
                "To join sheets exactly, use the record ID columns (grey group): they are DHIS2's own " +
                "links and do not depend on typing.",
        ],
        [
            "The IDs nest",
            "Patient HF025/W16/011 is in ward HF025/W16, in facility HF025. They are unique only " +
                "within one survey, so filter Survey name first. A ward typed without its facility " +
                "(W16) is shown in full (HF025/W16). The extract compares IDs ignoring case, spaces, " +
                "leading zeros, a trailing slash and Cyrillic look-alike letters.",
        ],
    ];
    if (survey) lines.push([nameOf(survey), "One row per survey."]);
    if (facility) {
        lines.push([
            nameOf(facility),
            "One row per facility taking part in a survey. Linked to its survey by Survey record ID.",
        ]);
    }
    if (wards) {
        lines.push([
            nameOf(wards),
            "One row per ward of a facility. Linked to its facility by Facility record ID.",
        ]);
    }
    if (caseReport) {
        lines.push([
            caseSheet,
            "One row per patient. Linked to its survey by Survey record ID. Facility record ID" +
                (wards ? " and Ward record ID are" : " is") +
                " worked out by the extract, as the app stores no such link.",
        ]);
    }
    if (patientForms.length > 0) {
        lines.push([
            patientForms.join(", "),
            `One row per form filled in for a patient. Case report record ID points at the ` +
                `patient's row on ${caseSheet}. Unique facility ID and Unique ward ID are copied ` +
                `from that case report; Unique survey patient ID is the one typed on the form itself.`,
        ]);
    }
    if (wardStatistics.length > 0) {
        lines.push([
            wardStatistics.join(", "),
            "Aggregate ward statistics. Linked to a facility by DHIS2 org unit ID, and to a ward by Unique ward ID.",
        ]);
    }
    lines.push(
        [
            "Data check",
            "Rows with a warning are shaded orange and say why in Data check and Data check " +
                "details. The warnings are explained under Data checks below.",
        ],
        [
            "In Excel",
            `To bring a value across, e.g. a case report answer onto a lab row: =XLOOKUP(<Case ` +
                `report record ID cell>, '${caseSheet}'!<Record ID column>, '${caseSheet}'!<column you want>)`,
        ],
        ["Power BI / SQL", `Every join is listed on the ${JOINS_SHEET} sheet.`]
    );
    return lines;
}

export function writeIndexSheet(
    workbook: Writer,
    all: FormData[],
    unresolved: { spec: FormSpec; reason: string }[],
    baseUrl: string,
    sheetNames: Map<string, string>,
    extra?: {
        country?: ResolvedCountry;
        integrity?: IntegrityReport;
        reconciliation?: { formKey: string; expected?: number; actual: number }[];
        discoveries?: FormDiscovery[];
    }
): void {
    const sheet = workbook.addWorksheet(READ_ME_SHEET);
    [34, 62, 14, 14, 14, 14, 14, 14, 14, 14, 14].forEach(
        (width, i) => (sheet.getColumn(i + 1).width = width)
    );
    const byKey = new Map(all.map(d => [d.form.key, d]));
    const titleOf = (key: string) => sheetNames.get(key) ?? titleLookup(all)(key);
    const heading = (cells: (string | number)[]) => (sheet.addRow(cells).font = { bold: true });

    sheet.addRow(["AMR Surveys extraction"]).font = { bold: true, size: 14 };
    sheet.addRow(["Server", baseUrl]);
    sheet.addRow(["Extracted at", new Date().toISOString()]);
    if (extra?.country) {
        const c = extra.country;
        sheet.addRow([
            "Country",
            `${c.name}${c.code ? ` (${c.code})` : ""} uid=${c.id} level=${c.level}`,
        ]);
    }
    sheet.addRow(["Note", "Read-only extraction. One sheet per form."]);
    sheet.addRow([]);
    heading(["How to read this workbook"]);
    const legend = sheet.addRow([
        "Header colours",
        ...Object.values(COLUMN_GROUPS).map(g => g.name),
    ]);
    Object.values(COLUMN_GROUPS).forEach(
        (group, i) => (legend.getCell(i + 2).fill = solidFill(group.fill))
    );
    for (const line of howTheSheetsLink(all, sheetNames)) {
        sheet.addRow(line).getCell(2).alignment = { wrapText: true, vertical: "top" };
    }
    sheet.addRow([]);

    heading([
        "Sheet",
        "Form name in DHIS2",
        "DHIS2 id",
        "DHIS2 kind",
        "Custom version",
        "Belongs to",
        "Link field in DHIS2",
        "Records",
        "With a data check",
        "Expected",
        "Count check",
    ]);

    const expectedByKey = new Map((extra?.reconciliation ?? []).map(r => [r.formKey, r.expected]));
    for (const { form, records } of all) {
        const expected = expectedByKey.get(form.key);
        const reconciled =
            expected === undefined ? "n/a" : expected === records.length ? "OK" : "MISMATCH";
        const parent = form.parentKey ? byKey.get(form.parentKey)?.form : undefined;
        sheet.addRow([
            sheetNames.get(form.key) ?? form.title,
            form.serverName,
            form.uid,
            form.kind,
            form.isCustom ? "yes" : "no",
            parent ? sheetNames.get(parent.key) ?? parent.title : "(top level)",
            form.parentLinkField || "(none)",
            records.length,
            records.filter(r => r.flags.length > 0).length,
            expected ?? "n/a",
            reconciled,
        ]);
    }

    sheet.addRow([]);
    heading(["Sheets and what they belong to (records)"]);
    const renderTree = (data: FormData, depth: number) => {
        sheet.addRow([
            `${"    ".repeat(depth)}${depth > 0 ? "└─ " : ""}${
                sheetNames.get(data.form.key) ?? data.form.title
            }`,
            data.records.length,
        ]);
        for (const child of all.filter(d => d.form.parentKey === data.form.key))
            renderTree(child, depth + 1);
    };
    for (const root of all.filter(d => !d.form.parentKey)) renderTree(root, 0);
    for (const detached of all.filter(d => d.form.parentKey && !byKey.has(d.form.parentKey))) {
        renderTree(detached, 0);
    }

    if (unresolved.length > 0) {
        sheet.addRow([]);
        heading(["Not extracted", "Reason"]);
        for (const { spec, reason } of unresolved) sheet.addRow([spec.requestedName, reason]);
    }

    const flagged = summariseFlags(all);
    sheet.addRow([]);
    heading(["Data checks per sheet", "Data check", "Records"]);
    if (flagged.length === 0) sheet.addRow(["none"]);
    for (const f of flagged) sheet.addRow([f.sheet, f.flag, f.count]);
    sheet.addRow([]);
    heading(["Data check", "Meaning"]);
    for (const [flag, meaning] of Object.entries(FLAG_MEANINGS)) sheet.addRow([flag, meaning]);

    const integrity = extra?.integrity;
    if (integrity) {
        if (integrity.offFormFields.length > 0) {
            // A field can be off-form in two programs merged into one sheet: one row per column.
            const byColumn = new Map<string, { sheet: string; column: string; values: number }>();
            for (const f of integrity.offFormFields) {
                const key = `${f.sheet}|${f.column}`;
                const row = byColumn.get(key) ?? { ...f, values: 0 };
                row.values += f.values;
                byColumn.set(key, row);
            }
            sheet.addRow([]);
            heading([
                "Questions no longer on the form",
                "Column (marked [not on current form])",
                "Values",
            ]);
            sheet.addRow([
                "",
                "Data entered in fields since removed from the form. The app no longer shows them; " +
                    "this extract keeps them. Headers use the field's full DHIS2 name.",
            ]);
            const sheetOrder = new Map(all.map((d, i) => [d.form.key, i]));
            const rows = [...byColumn.values()].sort(
                (a, b) =>
                    (sheetOrder.get(a.sheet) ?? 0) - (sheetOrder.get(b.sheet) ?? 0) ||
                    a.column.localeCompare(b.column, undefined, { numeric: true })
            );
            for (const f of rows) sheet.addRow([titleOf(f.sheet), f.column, f.values]);
        }

        const findings: [string, string][] = [];
        for (const o of integrity.otherDataSetValues) {
            findings.push([
                `other dataSet's values: ${titleOf(o.formKey)}`,
                `${o.count} value(s) returned for this dataSet belong to another dataSet's wards (the ward ` +
                    `dataSets share data elements); they are on that dataSet's sheet, not this one`,
            ]);
        }
        for (const u of integrity.unresolvedFacility) {
            findings.push([
                `no facility: ${titleOf(u.formKey)}`,
                `${u.count} record(s) had no (Survey_id, org_unit_id) match in the Facility sheet`,
            ]);
        }
        for (const u of integrity.unresolvedWard) {
            findings.push([
                `no ward: ${titleOf(u.formKey)}`,
                `${u.count} record(s) name a ward that is not on their facility's ward list, so they have no Ward_id`,
            ]);
        }
        for (const a of integrity.ambiguousFacilityCodes) {
            findings.push([
                "conflicting Hospital IDs",
                `org unit ${a.orgUnit} has Facility records with Hospital IDs ${a.codes.join(
                    ", "
                )}; ` + `its ward statistics rows have no Facility_code or Ward_code`,
            ]);
        }
        for (const a of integrity.ambiguousFacilities.slice(0, 50)) {
            findings.push([
                "ambiguous facility",
                `survey ${a.surveyId} + orgUnit ${a.orgUnit} matches ${
                    a.facilityIds.length
                }: ${a.facilityIds.join(", ")}`,
            ]);
        }
        for (const u of integrity.unresolvedStageEvents) {
            findings.push([
                `SKIPPED events: ${titleOf(u.formKey)}`,
                `${u.count} event(s) referenced unresolvable program stage ${u.programStage} — their data was NOT extracted`,
            ]);
        }
        for (const d of integrity.duplicateStageEvents) {
            findings.push([
                `duplicate stage events: ${titleOf(d.formKey)}`,
                `${d.count} extra event(s) on single-entry stage ${d.programStage} — the last event's values overwrote the earlier ones in the shared row`,
            ]);
        }
        for (const c of integrity.sheetNameCollisions) {
            findings.push([
                `sheet name collision: ${c.key}`,
                `assigned "${c.assignedName}" after a truncation/sanitization collision — no data lost, name changed`,
            ]);
        }
        for (const h of integrity.unresolvedHeaders) {
            findings.push([
                `deleted field: ${titleOf(h.formKey)}`,
                `${h.kind} ${h.id} holds values but no longer exists in DHIS2 metadata; the header shows its id`,
            ]);
        }

        sheet.addRow([]);
        heading(["Other findings", "Detail"]);
        if (findings.length === 0) sheet.addRow(["none"]);
        for (const f of findings) sheet.addRow(f);
    }
    sheet.commit();
}

// --- Country resolution & discovery -------------------------------------------

export type ResolvedCountry = {
    id: string;
    name: string;
    code?: string;
    level: number;
    matchedBy: string;
};

const UID_RE = /^[A-Za-z][A-Za-z0-9]{10}$/;
const COUNTRY_FIELDS = { id: true, name: true, code: true, level: true } as const;

/**
 * Every record traces to a Survey, and a Survey's org unit is its country, so the Survey
 * form's org units are the countries that have data.
 */
async function countriesWithData(
    api: D2Api,
    session: SessionManager,
    forms: ResolvedForm[]
): Promise<ResolvedCountry[]> {
    const survey = forms.find(f => f.defaultUid === PREVALENCE_SURVEY_FORM_ID);
    if (!survey)
        throw new Error("--per-country needs the Survey form, which could not be resolved.");

    const meta = await fetchProgramMeta(api, session, survey.uid);
    const opts: FetchOpts = { pageSize: 500, requests: createLimiter(REQUEST_CONCURRENCY) };
    const { records } = await fetchEvents(api, survey, meta, opts, session, emptyIntegrityReport());
    const ids = [...new Set(records.map(r => r.orgUnit).filter(Boolean))];
    if (ids.length === 0)
        throw new Error("--per-country found no Survey records to take countries from.");

    const { organisationUnits } = await session.retryWithBackoff(() =>
        api.metadata
            .get({ organisationUnits: { fields: COUNTRY_FIELDS, filter: { id: { in: ids } } } })
            .getData()
    );
    return organisationUnits
        .map(ou => ({ ...ou, matchedBy: "survey" }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Resolves --country by code (e.g. KEN), then exact name, then UID. Fails loudly and lists
 * candidates on ambiguity rather than silently picking one.
 */
export async function resolveCountry(
    api: D2Api,
    session: SessionManager,
    input: string
): Promise<ResolvedCountry> {
    const term = input.trim();

    const attempts = [
        { matchedBy: "code", filter: { code: { eq: term.toUpperCase() } } },
        { matchedBy: "name", filter: { name: { eq: term } } },
        ...(UID_RE.test(term) ? [{ matchedBy: "uid", filter: { id: { eq: term } } }] : []),
    ];

    for (const attempt of attempts) {
        const { organisationUnits } = await session.retryWithBackoff(() =>
            api.metadata
                .get({ organisationUnits: { fields: COUNTRY_FIELDS, filter: attempt.filter } })
                .getData()
        );

        if (organisationUnits.length === 1) {
            const ou = organisationUnits[0]!;
            return { ...ou, matchedBy: attempt.matchedBy };
        }
        if (organisationUnits.length > 1) {
            throw new Error(
                `--country "${term}" is ambiguous by ${attempt.matchedBy}: ` +
                    organisationUnits.map(o => `${o.name} (${o.id})`).join("; ")
            );
        }
    }
    throw new Error(
        `Could not resolve --country "${term}" by code, name or UID. ` +
            `Try the ISO3 code (e.g. KEN), the exact org unit name, or its UID.`
    );
}

export type StageDiscovery = {
    /** The exact sheet key extraction would assign — computed via the same shared
     * assignStageChildKey()/buildStageChildForm() helpers fetchTracker uses, so this is a
     * prediction that cannot drift from what a real run would produce. */
    sheetKey: string;
    stageName: string;
    parentFormKey: string;
    /** Row count for this repeatable stage under the scope (probed server-side). */
    rows: number;
    /** Column count this stage's own sheet would have (ancestor keys + fixed + stage fields). */
    columns: number;
};

export type FormDiscovery = {
    form: ResolvedForm;
    /** Record count for this form under the country, or undefined if not probeable. */
    total?: number;
    minDate?: string;
    maxDate?: string;
    /** Expected column count on this form's own (main) sheet, when staticly determinable. */
    columns?: number;
    /** Repeatable-stage child sheets this form would produce. */
    stages: StageDiscovery[];
};

/**
 * Column count of a sheet before any record is fetched: the sheetColumns of its configured
 * fields, so the forecast and the written sheet agree (fields no longer on the form that
 * still hold values can only add to it).
 */
export function computeColumnCount(
    form: ResolvedForm,
    byKey: Map<string, FormData>,
    meta: ProgramMeta,
    stage?: ProgramStageMeta
): number {
    const columns = configuredColumns(meta, form.kind, stage);
    return sheetColumns({ form, records: [], columns }, byKey).length;
}

/**
 * Probes one repeatable stage's row count directly — DHIS2's events endpoint accepts a
 * `programStage` filter, so this is one more pageSize=1/totalPages=true call, exactly as
 * cheap as the top-level probes above. Not a guess: an accurate server-side count.
 */
async function probeStageRows(
    api: D2Api,
    programUid: string,
    stageId: string,
    orgUnit: string,
    session: SessionManager
): Promise<number> {
    const resp = await session.retryWithBackoff(() =>
        api.tracker.events
            .get({
                fields: { event: true },
                program: programUid,
                programStage: stageId,
                orgUnit,
                ouMode: "DESCENDANTS",
                page: 1,
                pageSize: 1,
                totalPages: true,
            })
            .getData()
    );
    return resp.total ?? 0;
}

/**
 * Cheap preflight probe: for a tracker/event form, 1 count call + 2 date calls (pageSize=1),
 * plus 1 metadata call (needed to know column counts and enumerate repeatable stages), plus
 * 1 row-count call per repeatable stage. Deliberately per-FORM (and per-STAGE), never
 * per-facility — probing each facility would be O(forms x facilities) calls for no extra
 * information the country-wide scope doesn't already give us.
 */
async function discoverForm(
    api: D2Api,
    form: ResolvedForm,
    orgUnit: string,
    session: SessionManager,
    byKey: Map<string, FormData>
): Promise<FormDiscovery> {
    if (form.kind === "dataSet") {
        // dataValueSets has no cheap count/period probe; scope comes from --start-date/--end-date.
        return { form, stages: [] };
    }

    if (form.kind === "event") {
        const probe = (direction: "asc" | "desc") =>
            session.retryWithBackoff(() =>
                api.tracker.events
                    .get({
                        fields: { event: true, occurredAt: true },
                        program: form.uid,
                        orgUnit,
                        ouMode: "DESCENDANTS",
                        page: 1,
                        pageSize: 1,
                        totalPages: true,
                        order: `occurredAt:${direction}`,
                    })
                    .getData()
            );

        const [first, last, meta] = await Promise.all([
            probe("asc"),
            probe("desc"),
            fetchProgramMeta(api, session, form.uid),
        ]);
        return {
            form,
            total: first.total ?? 0,
            minDate: first.instances[0]?.occurredAt,
            maxDate: last.instances[0]?.occurredAt,
            columns: computeColumnCount(form, byKey, meta),
            stages: [],
        };
    }

    // tracker
    const probe = (direction: "asc" | "desc") =>
        session.retryWithBackoff(() =>
            api.tracker.trackedEntities
                .get({
                    fields: { trackedEntity: true, createdAt: true },
                    program: form.uid,
                    orgUnit,
                    ouMode: "DESCENDANTS",
                    page: 1,
                    pageSize: 1,
                    totalPages: true,
                    order: [{ type: "field", field: "createdAt", direction }],
                })
                .getData()
        );

    const [first, last, meta] = await Promise.all([
        probe("asc"),
        probe("desc"),
        fetchProgramMeta(api, session, form.uid),
    ]);

    const repeatableStages = [...meta.stageById.values()]
        .filter(s => s.repeatable)
        .sort((a, b) => a.id.localeCompare(b.id));
    const stageRowCounts = await mapWithConcurrency(repeatableStages, FETCH_CONCURRENCY, s =>
        probeStageRows(api, form.uid, s.id, orgUnit, session)
    );

    const usedKeys = new Set<string>([form.key]);
    const stages: StageDiscovery[] = repeatableStages.map((stage, idx) => {
        const sheetKey = assignStageChildKey(form.key, stage, usedKeys);
        const childForm = buildStageChildForm(form, stage, sheetKey);
        return {
            sheetKey,
            stageName: stage.name,
            parentFormKey: form.key,
            rows: stageRowCounts[idx] ?? 0,
            columns: computeColumnCount(childForm, byKey, meta, stage),
        };
    });

    return {
        form,
        total: first.total ?? 0,
        minDate: first.instances[0]?.createdAt,
        maxDate: last.instances[0]?.createdAt,
        columns: computeColumnCount(form, byKey, meta),
        stages,
    };
}

/** Runs the probes with bounded concurrency (mirrors glass-dev's FETCH_CONCURRENCY). */
export async function discover(
    api: D2Api,
    forms: ResolvedForm[],
    orgUnit: string,
    session: SessionManager
): Promise<FormDiscovery[]> {
    // A minimal, records-free FormData map so discoverForm can reuse the exact same
    // keyColumnsFor() the real writer uses — guaranteeing predicted and actual column
    // sets can never diverge.
    const byKey = new Map<string, FormData>(
        forms.map(f => [f.key, { form: f, records: [], columns: new Map() }])
    );

    return mapWithConcurrency(forms, FETCH_CONCURRENCY, f =>
        discoverForm(api, f, orgUnit, session, byKey)
    );
}

/** "CaseReport [custom]" / "CaseReport [default]": which program of a form is meant. */
function programLabel(form: ResolvedForm): string {
    return `${form.key} [${form.isCustom ? "custom" : "default"}]`;
}

function shortDate(iso: string | undefined): string {
    return iso ? iso.slice(0, 10) : "-";
}

// --- Workbook-size forecast -----------------------------------------------------

export type SheetForecast = {
    sheetKey: string;
    parentFormKey?: string;
    /** Exact: probed server-side. */
    rows?: number;
    /**
     * The sheet's columns: every field configured on the form gets one, answered or not (a
     * field no longer on the form that still holds values adds one more).
     */
    columns?: number;
    /**
     * rows x columns: an UPPER BOUND on the cells written, as an empty value writes no cell
     * and most configured fields are empty. Measured on KGZ: a stage with 222 configured
     * fields had values in 23, and the workbook came out ~12 MB against a 63-190 MB bound.
     */
    cells?: number;
};

export type WorkbookForecast = {
    sheets: SheetForecast[];
    /** UPPER BOUND, not a prediction — see the note on `cells` in SheetForecast. */
    totalCells: number;
    /** Upper-bound compressed .xlsx size range, derived from totalCells. */
    estimatedSizeBytesRange: [number, number];
    warnings: string[];
};

// Rough, clearly-labeled compressed-xlsx bytes/cell range, informed by an earlier live
// comparison against this same server (see README). Deliberately wide, not false-precise.
const BYTES_PER_CELL_LOW = 15;
const BYTES_PER_CELL_HIGH = 45;
const LARGE_SHEET_COLUMN_WARNING = 200;
const LARGE_SHEET_ROW_WARNING = 900_000; // 90% of Excel's 1,048,576-row cap
const LARGE_WORKBOOK_CELL_WARNING = 2_000_000;

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    const mb = bytes / (1024 * 1024);
    return mb < 1024 ? `${mb.toFixed(1)} MB` : `${(mb / 1024).toFixed(2)} GB`;
}

/**
 * The programs a run extracts: every program not proven empty and, for a form whose programs
 * are all proven empty, its default program, so that every form still gets its (empty)
 * sheet. Never narrows on anything but a proven zero.
 */
export function programsToExtract(
    forms: ResolvedForm[],
    totalByUid: Map<string, number | undefined>
): ResolvedForm[] {
    const hasData = (form: ResolvedForm) => totalByUid.get(form.uid) !== 0;
    const formsWithData = new Set(forms.filter(hasData).map(form => form.key));
    return forms.filter(
        form => hasData(form) || (!formsWithData.has(form.key) && form.uid === form.defaultUid)
    );
}

/**
 * Turns discovery results into a per-sheet row/column/cell forecast, a total workbook
 * size estimate, and warnings for unusually large sheets — everything needed to describe
 * the workbook BEFORE extraction runs (instruction #4).
 *
 * Uses extraction's own rule (programsToExtract), so it never predicts a sheet a real run
 * wouldn't produce, or vice versa.
 */
export function forecastWorkbook(discoveries: FormDiscovery[]): WorkbookForecast {
    const sheets: SheetForecast[] = [];
    const warnings: string[] = [];

    const addSheet = (f: SheetForecast) => {
        sheets.push(f);
        if (f.columns !== undefined && f.columns > LARGE_SHEET_COLUMN_WARNING) {
            warnings.push(
                `${f.sheetKey}: ${f.columns} columns — wide sheet, slow to browse by hand in Excel`
            );
        }
        if (f.rows !== undefined && f.rows > LARGE_SHEET_ROW_WARNING) {
            warnings.push(
                `${
                    f.sheetKey
                }: ${f.rows.toLocaleString()} rows — approaching Excel's 1,048,576-row limit`
            );
        }
    };

    const extracted = new Set(
        programsToExtract(
            discoveries.map(d => d.form),
            new Map(discoveries.map(d => [d.form.uid, d.total]))
        ).map(form => form.uid)
    );
    for (const d of discoveries.filter(d => extracted.has(d.form.uid))) {
        addSheet({
            sheetKey: d.form.key,
            rows: d.total,
            columns: d.columns,
            cells:
                d.total !== undefined && d.columns !== undefined ? d.total * d.columns : undefined,
        });
        // Every repeatable stage gets its sheet, with or without rows (see fetchTracker).
        for (const s of d.stages) {
            addSheet({
                sheetKey: s.sheetKey,
                parentFormKey: s.parentFormKey,
                rows: s.rows,
                columns: s.columns,
                cells: s.rows * s.columns,
            });
        }
    }

    const totalCells = sheets.reduce((sum, s) => sum + (s.cells ?? 0), 0);
    if (totalCells > LARGE_WORKBOOK_CELL_WARNING) {
        warnings.push(
            `workbook total: ~${totalCells.toLocaleString()} cells — large file; extraction and opening it in Excel may be slow`
        );
    }

    return {
        sheets,
        totalCells,
        estimatedSizeBytesRange: [
            totalCells * BYTES_PER_CELL_LOW,
            totalCells * BYTES_PER_CELL_HIGH,
        ],
        warnings,
    };
}

export function reportDiscovery(
    country: ResolvedCountry | undefined,
    rootOrgUnit: string,
    discoveries: FormDiscovery[],
    unresolved: { spec: FormSpec; reason: string }[]
): void {
    if (country) {
        console.log(
            `\nCountry resolved: ${country.name}` +
                `${country.code ? ` (${country.code})` : ""} uid=${country.id} ` +
                `level=${country.level} [matched by ${country.matchedBy}]`
        );
    } else {
        console.log(`\nScope: org unit ${rootOrgUnit} (with descendants)`);
    }

    console.log("\nForms detected (one row per program; programs of one form share a sheet):");
    console.log(
        "  " +
            [
                "SHEET".padEnd(18),
                "PROGRAM".padEnd(13),
                "KIND".padEnd(8),
                "CUSTOM".padEnd(7),
                "RECORDS".padStart(9),
                "COLS".padStart(6),
                "  FIRST".padEnd(13),
                "LAST",
            ].join("")
    );
    for (const d of discoveries) {
        const total = d.total === undefined ? "n/a" : String(d.total);
        const cols = d.columns === undefined ? "n/a" : String(d.columns);
        console.log(
            "  " +
                [
                    d.form.key.padEnd(18),
                    d.form.uid.padEnd(13),
                    d.form.kind.padEnd(8),
                    (d.form.isCustom ? "yes" : "no").padEnd(7),
                    total.padStart(9),
                    cols.padStart(6),
                    ("  " + shortDate(d.minDate)).padEnd(13),
                    shortDate(d.maxDate),
                ].join("")
        );
        for (const s of d.stages) {
            // Child sheet keys are inherently longer than top-level ones (Owner__StageName),
            // so a fixed-width column would overrun and mangle the row (verified live: e.g.
            // "Facility__WardData" already exceeds the 18-char budget above). A free-form,
            // explicitly-labelled line stays readable at any key length instead.
            console.log(
                `      ${s.sheetKey}` +
                    `  rows=${s.rows}  columns=${s.columns}` +
                    `  (repeatable stage "${s.stageName}" of ${s.parentFormKey})`
            );
        }
    }

    const withData = discoveries.filter(d => (d.total ?? 0) > 0);
    const empty = discoveries.filter(d => d.total === 0);
    const totalRecords = discoveries.reduce((sum, d) => sum + (d.total ?? 0), 0);
    const totalStageRecords = discoveries.reduce(
        (sum, d) => sum + d.stages.reduce((s, x) => s + (x.rows ?? 0), 0),
        0
    );

    console.log(`\nPlanned extraction scope:`);
    console.log(`  programs with data   : ${withData.length}/${discoveries.length}`);
    console.log(`  main-sheet records   : ${totalRecords}`);
    if (totalStageRecords > 0) {
        console.log(`  repeatable-stage rows: ${totalStageRecords}`);
    }
    if (empty.length > 0) {
        console.log(`  skipped (0 records): ${empty.map(d => programLabel(d.form)).join(", ")}`);
    }
    const dataSets = discoveries.filter(d => d.form.kind === "dataSet");
    if (dataSets.length > 0) {
        console.log(
            `  ${dataSets
                .map(d => d.form.key)
                .join(
                    ", "
                )}: aggregate dataSet — all periods unless --start-date/--end-date are given`
        );
    }
    if (unresolved.length > 0) {
        console.log(`  not extracted: ${unresolved.map(u => u.spec.requestedName).join("; ")}`);
    }

    const forecast = forecastWorkbook(discoveries);
    console.log(`\nWorkbook forecast:`);
    const formSheets = new Set(forecast.sheets.map(s => s.sheetKey)).size;
    console.log(
        `  worksheets    : ${
            3 + formSheets
        }  (${READ_ME_SHEET}, ${COLUMN_GUIDE_SHEET}, ${JOINS_SHEET} + ${formSheets} form sheet(s))`
    );
    console.log(`  rows          : exact (probed)`);
    console.log(`  columns       : every configured field, answered or not`);
    console.log(`  cells         : UPPER BOUND — empty values write no cell, and most are empty.`);
    console.log(`  max cells     : ~${forecast.totalCells.toLocaleString()}`);
    console.log(
        `  max size      : ${formatBytes(forecast.estimatedSizeBytesRange[0])} – ${formatBytes(
            forecast.estimatedSizeBytesRange[1]
        )}  (real files are typically several times smaller)`
    );
    if (forecast.warnings.length > 0) {
        console.log(`  warnings (based on the upper bound):`);
        for (const w of forecast.warnings) console.log(`    ! ${w}`);
    } else {
        console.log(`  no size/shape warnings`);
    }
}

/** Facilities that actually hold data, derived from the extracted Facility records (no extra calls). */
export function facilitiesWithData(all: FormData[], facilityKey: string): Set<string> {
    const facilityData = all.find(d => d.form.key === facilityKey);
    return new Set((facilityData?.records ?? []).map(r => r.orgUnit).filter(Boolean));
}

// --- Main ---------------------------------------------------------------------

type ExtractArgs = {
    output?: string;
    country?: string;
    orgUnit?: string;
    startDate?: string;
    endDate?: string;
    pageSize: number;
    dryRun: boolean;
    discover: boolean;
    perCountry: boolean;
    forms?: string;
};

/** Everything one scope's extraction needs that does not depend on the scope. */
type RunContext = {
    api: D2Api;
    session: SessionManager;
    baseUrl: string;
    envLabel: string;
    resolved: ResolvedForm[];
    unresolved: { spec: FormSpec; reason: string }[];
    args: ExtractArgs;
};

async function extract(args: ExtractArgs) {
    const envVars = getEnvVars();
    const baseUrl = envVars.url.replace(/\/+$/, "");
    const envLabel = deriveEnvLabel(baseUrl);

    console.log(`Connecting to ${baseUrl} (${describeAuth(envVars)}) [env: ${envLabel}]`);
    const api = getD2APiFromInstance(getInstance(envVars));

    // Forces DHIS2 to fully initialize the session before any real call (PAT bug workaround).
    await warmUpSession(api);
    const session = createSessionManager(api);

    const info = await session.retryWithBackoff(() => api.system.info.getData());
    console.log(`  DHIS2 ${info.version}`);

    const modules = await fetchModules(api, session);
    console.log(`  datastore modules: ${modules.map(m => m.name).join(", ") || "(none)"}`);

    const wanted = args.forms
        ? FORMS.filter(f =>
              args
                  .forms!.split(",")
                  .map(s => s.trim())
                  .includes(f.key)
          )
        : FORMS;
    if (wanted.length === 0) throw new Error(`No forms matched --forms=${args.forms}`);

    const { resolved, unresolved } = await resolveForms(api, session, modules, wanted);
    linkParents(resolved);
    reportResolution(resolved, unresolved);

    if (args.dryRun) {
        console.log("\nDry run: no data extracted, no file written.");
        return;
    }
    if (resolved.length === 0) throw new Error("No forms could be resolved; nothing to extract.");

    const ctx: RunContext = { api, session, baseUrl, envLabel, resolved, unresolved, args };

    if (args.perCountry) {
        if (args.country || args.orgUnit) {
            throw new Error("--per-country cannot be combined with --country or --org-unit.");
        }
        const countries = await countriesWithData(api, session, resolved);
        console.log(
            `\nCountries with data (${countries.length}): ${countries
                .map(c => c.code || c.name)
                .join(", ")}`
        );

        // One country failing (after its retries) must not cost the others their workbooks.
        const results: { country: ResolvedCountry; programs?: string[]; error?: string }[] = [];
        for (const country of countries) {
            console.log(`\n=== ${country.name}${country.code ? ` (${country.code})` : ""} ===`);
            try {
                results.push({ country, programs: await extractScope(ctx, country, country.id) });
            } catch (err) {
                const error = err instanceof Error ? err.message : String(err);
                console.error(`  ! ${country.name}: FAILED — ${error}`);
                results.push({ country, error });
            }
        }

        console.log("\nPrograms used per country:");
        for (const { country, programs, error } of results) {
            const label = country.code || country.name;
            console.log(
                `  ${label}: ${error ? `FAILED — ${error}` : programs?.join("; ") || "(none)"}`
            );
        }
        const failed = results.filter(r => r.error);
        if (failed.length > 0) {
            throw new Error(
                `${failed.length} of ${results.length} countries failed: ${failed
                    .map(r => r.country.code || r.country.name)
                    .join(", ")}`
            );
        }
        return;
    }

    const country = args.country ? await resolveCountry(api, session, args.country) : undefined;
    await extractScope(ctx, country, args.orgUnit ?? country?.id);
}

/**
 * Discovers, extracts and writes one workbook for one scope (a country, an org unit, or
 * everything readable). Returns the programs it extracted, as "Form: program (records)".
 */
async function extractScope(
    ctx: RunContext,
    country: ResolvedCountry | undefined,
    rootOrgUnit: string | undefined
): Promise<string[]> {
    const { api, session, baseUrl, envLabel, resolved, unresolved, args } = ctx;
    const started = Date.now();
    const elapsed = () => `${((Date.now() - started) / 1000).toFixed(1)}s`;

    // --- Discovery ------------------------------------------------------------
    let discoveries: FormDiscovery[] = [];
    if (rootOrgUnit) {
        console.log("\nDiscovering ...");
        discoveries = await discover(api, resolved, rootOrgUnit, session);
        reportDiscovery(country, rootOrgUnit, discoveries, unresolved);
    } else if (args.discover) {
        throw new Error("--discover requires --country (or --org-unit) to scope the probes.");
    }

    if (args.discover) {
        console.log("\nDiscovery only: no data extracted, no file written.");
        return [];
    }

    // Only skip programs proven to have exactly zero records — never narrow on anything else.
    const totalByUid = new Map(discoveries.map(d => [d.form.uid, d.total]));
    const toExtract = programsToExtract(resolved, totalByUid);
    const skipped = resolved.filter(f => !toExtract.includes(f));
    if (skipped.length > 0) {
        console.log(
            `\nSkipping ${skipped.length} program(s) with 0 records: ${skipped
                .map(programLabel)
                .join(", ")} (every form still gets its sheet)`
        );
    }

    console.log(`\nExtracting ... (discovery took ${elapsed()})`);
    const opts: FetchOpts = {
        orgUnit: rootOrgUnit,
        pageSize: args.pageSize,
        startDate: args.startDate,
        endDate: args.endDate,
        requests: createLimiter(REQUEST_CONCURRENCY),
        // Without a scope, dataSets are read under the user's own root org units.
        dataSetRoots:
            !rootOrgUnit && toExtract.some(f => f.kind === "dataSet")
                ? await userRootOrgUnits(api, session)
                : undefined,
    };

    // Declared before extraction (not after) so fetchTracker can record diagnostics
    // (e.g. unresolved stage events) as they happen, not as an afterthought.
    const integrity = emptyIntegrityReport();

    // Programs are independent, so several are fetched at once; their page requests share
    // one cap (opts.requests). `mapWithConcurrency` preserves input order, so sheet order
    // stays deterministic regardless of which program finishes first.
    const perProgram = (
        await mapWithConcurrency(toExtract, EXTRACT_CONCURRENCY, async form => {
            const formOpts = { ...opts, total: totalByUid.get(form.uid) };
            if (form.kind === "dataSet")
                return [await fetchDataSet(api, form, formOpts, session, integrity)];
            const meta = await fetchProgramMeta(api, session, form.uid);
            if (form.kind !== "tracker")
                return [await fetchEvents(api, form, meta, formOpts, session, integrity)];
            const { main, stageForms } = await fetchTracker(
                api,
                form,
                meta,
                formOpts,
                session,
                integrity
            );
            for (const stage of stageForms) {
                console.log(`  ${stage.form.key}: ${stage.records.length} rows (repeatable stage)`);
            }
            return [main, ...stageForms];
        })
    ).flat();
    console.log(`  fetched in ${elapsed()}`);

    const programs = perProgram
        .filter(d => d.form.kind !== "trackerStage")
        .map(d => `${d.form.key}: ${d.form.serverName} (${d.records.length})`);

    // One sheet per form, however many programs back it.
    const all = mergeByFormKey(perProgram);

    const byKey = new Map(all.map(d => [d.form.key, d]));
    const recordIndex = new Map(all.map(d => [d.form.key, new Map(d.records.map(r => [r.id, r]))]));

    // --- Integrity ------------------------------------------------------------
    const facilityForm = resolved.find(f => f.defaultUid === PREVALENCE_FACILITY_LEVEL_FORM_ID);
    if (facilityForm) resolveFacilityIds(all, facilityForm.key, integrity);
    resolveReadableCodes(all, recordIndex, facilityForm?.key, integrity);
    await flagRecords(all, recordIndex, ids => lookUpReferences(api, session, ids));
    flagIdMismatches(all, recordIndex, facilityForm?.key);

    // Reconciliation: what discovery said exists vs what we actually pulled. This is what
    // proves the skip/scope optimisation above never silently dropped data.
    const expected = expectedRecordCounts(toExtract, totalByUid, discoveries);
    const reconciliation = all.map(d => ({
        formKey: d.form.key,
        expected: expected.get(d.form.key),
        actual: d.records.length,
    }));
    const mismatches = reconciliation.filter(
        r => r.expected !== undefined && r.expected !== r.actual
    );
    if (mismatches.length > 0) {
        console.warn("\n  ! RECONCILIATION MISMATCH — extracted count != discovered count:");
        const titleOf = titleLookup(all);
        for (const m of mismatches) {
            console.warn(`      ${titleOf(m.formKey)}: expected ${m.expected}, got ${m.actual}`);
        }
    } else if (discoveries.length > 0) {
        console.log("\nReconciliation: all forms match their discovered counts.");
    }

    const orgUnitIds = [
        ...new Set(all.flatMap(d => d.records.map(r => r.orgUnit)).filter(Boolean)),
    ];
    console.log(`\nResolving ${orgUnitIds.length} org unit names ...`);
    const orgUnitNames = await fetchOrgUnitNames(api, session, orgUnitIds);

    // Name the file after the instance and country so an extract is never ambiguous
    // about where it came from (mirrors glass-dev's deriveEnvLabel convention).
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const countryPart = country ? `${(country.code || country.name).toLowerCase()}_` : "";
    const fileName = `amr-surveys_${envLabel}_${countryPart}${timestamp}.xlsx`;

    // With --per-country, --output names a directory (one file per country goes in it).
    const outPath = args.perCountry
        ? path.resolve(args.output ?? "extracts", fileName)
        : path.resolve(args.output ?? `extracts/${fileName}`);
    // Written under a temporary name and renamed when complete, so a run that dies midway
    // never leaves a truncated workbook that looks like a finished extract.
    const partialPath = `${outPath}.partial`;
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    console.log("Writing workbook ...");
    // Streaming: rows go to disk as they are written instead of building the whole workbook
    // in memory first, which was two thirds of a country's run time.
    // Its zip library defaults to the fastest compression (level 1); level 6 makes the file
    // about a quarter smaller for a second or two of CPU.
    const workbook = new Excel.stream.xlsx.WorkbookWriter({
        filename: partialPath,
        useStyles: true,
        useSharedStrings: true,
        zip: { zlib: { level: 6 } },
    });
    workbook.creator = "amr-surveys extract-forms";
    workbook.created = new Date();

    // Collision-safe, deterministic Excel tab names for every sheet, computed once up
    // front so a truncation/sanitization collision can never silently overwrite another
    // sheet. The workbook's own sheets are reserved so a form title can never take them.
    const sheetNames = assignSheetNames(
        all.map(d => ({ key: d.form.key, name: d.form.title, stableId: d.form.uid })),
        [READ_ME_SHEET, COLUMN_GUIDE_SHEET, JOINS_SHEET],
        integrity
    );

    writeIndexSheet(workbook, all, unresolved, baseUrl, sheetNames, {
        country,
        integrity,
        reconciliation,
        discoveries,
    });
    writeColumnGuideSheet(workbook, all, byKey, orgUnitNames, sheetNames);
    writeJoinsSheet(workbook, all, facilityForm?.key, sheetNames);
    for (const data of all) {
        const name =
            sheetNames.get(data.form.key) ?? data.form.title.slice(0, EXCEL_SHEET_NAME_MAX);
        writeFormSheet(workbook, data, byKey, orgUnitNames, name);
    }
    await workbook.commit();
    fs.renameSync(partialPath, outPath);

    const total = all.reduce((sum, d) => sum + d.records.length, 0);
    console.log(
        `\nDone in ${elapsed()}. ${total} records across ${all.length} sheets -> ${outPath}`
    );

    const facilities = facilityForm ? facilitiesWithData(all, facilityForm.key) : new Set();
    if (facilities.size > 0) console.log(`  facilities with data: ${facilities.size}`);
    reportIntegrity(integrity, all);
    return programs;
}

/** The user's root org units for data reads: data-view roots, else capture roots. */
async function userRootOrgUnits(api: D2Api, session: SessionManager): Promise<string[]> {
    const me = await session.retryWithBackoff(() =>
        api
            .get<{
                organisationUnits?: { id: string }[];
                dataViewOrganisationUnits?: { id: string }[];
            }>("/me", {
                fields: "organisationUnits[id],dataViewOrganisationUnits[id]",
            })
            .getData()
    );
    const roots = me.dataViewOrganisationUnits?.length
        ? me.dataViewOrganisationUnits
        : me.organisationUnits ?? [];
    return roots.map(ou => ou.id);
}

function main() {
    // Env is loaded by `-r dotenv/config` (see package.json), with
    // DOTENV_CONFIG_PATH=.env.local — same convention as the glass-dev scripts.
    const cmd = command({
        name: "extract-forms",
        description: "Read-only extraction of AMR Surveys forms into an Excel workbook",
        args: {
            output: option({
                type: optional(string),
                long: "output",
                short: "o",
                description:
                    "Output .xlsx path (a directory with --per-country). Defaults to extracts/amr-surveys_<env>_<country>_<timestamp>.xlsx",
            }),
            country: option({
                type: optional(string),
                long: "country",
                description:
                    "Country to extract: ISO3 code (KEN), exact org unit name (Kenya), or UID. Scopes everything to that subtree.",
            }),
            orgUnit: option({
                type: optional(string),
                long: "org-unit",
                description:
                    "Root org unit UID (with descendants). Overrides --country. Omit both to extract everything the user can read.",
            }),
            startDate: option({
                type: optional(string),
                long: "start-date",
                description:
                    "Start date YYYY-MM-DD (Ward Summary Statistics only; default 2000-01-01)",
            }),
            endDate: option({
                type: optional(string),
                long: "end-date",
                description: "End date YYYY-MM-DD (Ward Summary Statistics only; default today)",
            }),
            pageSize: option({
                type: number,
                long: "page-size",
                defaultValue: () => 500,
                description: "Records per API request",
            }),
            forms: option({
                type: optional(string),
                long: "forms",
                description: "Comma-separated subset of form keys (default: all)",
            }),
            dryRun: flag({
                type: boolean,
                long: "dry-run",
                description: "Resolve names to UIDs and print the mapping without extracting",
            }),
            perCountry: flag({
                type: boolean,
                long: "per-country",
                description:
                    "Write one workbook per country that has data (countries are taken from the Survey records), and print the programs each country used.",
            }),
            discover: flag({
                type: boolean,
                long: "discover",
                description:
                    "Preflight only: report country, forms detected, record counts, min/max dates and the planned scope. Extracts nothing.",
            }),
        },
        handler: async args => {
            try {
                await extract(args);
            } catch (err) {
                console.error(`\nFailed: ${err instanceof Error ? err.message : String(err)}`);
                process.exit(1);
            }
        },
    });

    run(cmd, process.argv.slice(2));
}

// Only run when invoked directly, so the pure helpers above stay importable by tests.
if (require.main === module) {
    main();
}
