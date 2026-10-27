/* Prevalence > Central Reference Lab form, against the instance in .env.local (read-only: see env.js).
   Run: `yarn e2e`. The surveys, facilities and patients used are in support.ts. */
import { Browser, expect, Page, test } from "@playwright/test";
import {
    CENTRAL_REF_LAB_PROGRAM,
    chooseSpecies,
    drugRow,
    enterResult,
    getSavedAntibioticsByStage,
    interceptSave,
    openLabItem,
    openPatients,
    openSavedCentralRefLab,
    places,
    readDrugRows,
    readDrugRowsByStage,
    readSavedSlots,
    waitForForm,
} from "./support";

// Klebsiella pneumoniae is in the CLSI "Enterobacterales" group: 72 drugs in alphabetical order. Before the
// grid could show them all it stopped at the 29th (Ceftriaxone).
const KLEBSIELLA = "Klebsiella pneumoniae";
const ENTEROBACTERALES_DRUGS = 72;
const THIRTIETH = "Cefuroxime";
const SEVENTIETH = "Tobramycin";
const OTHER_GROUP_SPECIES = "Staphylococcus aureus";

// Each species stage holds 30 antibiotic results.
const SLOTS_PER_SPECIES = 30;

// Budgets with room for a slow day. Before the speed fix the form took 42-44 s to open here.
const OPEN_BUDGET_MS = 30_000;
const ENTRY_BUDGET_MS = 3_000;

const log = (line: string) => {
    // eslint-disable-next-line no-console -- measurements and checked values, shown in the test output
    console.log(line);
};

async function newPage(browser: Browser, baseURL: string | undefined) {
    const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
    return context.newPage();
}

test.describe("new Central Reference Lab form", () => {
    // The steps share one form, opened once: each step starts where the previous one ended.
    test.describe.configure({ mode: "serial" });
    let page: Page;

    test.beforeAll(async ({ browser }, testInfo) => {
        page = await newPage(browser, testInfo.project.use.baseURL);
        await openPatients(page, places.malawi);
    });
    test.afterAll(async () => page.context().close());

    test("opens within budget, loading the form metadata once", async () => {
        const metadataRequests: string[] = [];
        page.on("request", request => {
            if (request.url().includes("metadata.json")) metadataRequests.push(request.url());
        });

        const started = Date.now();
        await openLabItem(
            page,
            page.getByRole("row", { name: places.malawi.patient }),
            "New Central Ref Lab Results"
        );
        const openMs = await waitForForm(page, started);
        log(`OPEN_MS ${openMs} METADATA_REQUESTS ${metadataRequests.length}`);

        expect(openMs, "form opening time").toBeLessThan(OPEN_BUDGET_MS);
        expect(metadataRequests, "form metadata downloads").toHaveLength(1);
    });

    test("lists every drug of a group longer than the form's slots, all empty", async () => {
        await chooseSpecies(page, KLEBSIELLA);

        const rows = await readDrugRows(page);
        expect(Object.keys(rows)).toHaveLength(ENTEROBACTERALES_DRUGS);
        expect(Object.values(rows).every(result => result === "")).toBe(true);
        await expect(drugRow(page, THIRTIETH)).toBeVisible();
        await expect(drugRow(page, SEVENTIETH)).toBeVisible();
    });

    test("records results for drugs beyond the 29th quickly", async () => {
        const ms = [
            await enterResult(page, THIRTIETH, "Resistant"),
            await enterResult(page, SEVENTIETH, "Susceptible"),
        ];
        log(`ENTRY_MS ${ms.join(" ")}`);

        const rows = await readDrugRows(page);
        expect(rows[THIRTIETH]).toBe("Resistant");
        expect(rows[SEVENTIETH]).toBe("Susceptible");
        expect(Object.values(rows).filter(Boolean)).toHaveLength(2);
        ms.forEach(entryMs =>
            expect(entryMs, "time to show an entered result").toBeLessThan(ENTRY_BUDGET_MS)
        );
    });

    test("clears the entered results when the species changes", async () => {
        await chooseSpecies(page, OTHER_GROUP_SPECIES);
        await expect(drugRow(page, THIRTIETH)).toHaveCount(0);
        expect(Object.values(await readDrugRows(page)).filter(Boolean)).toEqual([]);

        await chooseSpecies(page, KLEBSIELLA);
        const rows = await readDrugRows(page);
        expect(Object.keys(rows)).toHaveLength(ENTEROBACTERALES_DRUGS);
        expect(Object.values(rows).filter(Boolean)).toEqual([]);
    });

    test("when all slots are used, says so and offers no more drugs", async () => {
        const drugs = Object.keys(await readDrugRows(page)).slice(0, SLOTS_PER_SPECIES);
        const ms: number[] = [];
        for (const drug of drugs) ms.push(await enterResult(page, drug, "Susceptible"));
        log(
            `FILL_${SLOTS_PER_SPECIES}_MS total ${ms.reduce((a, b) => a + b, 0)} max ${Math.max(
                ...ms
            )}`
        );

        const rows = await readDrugRows(page);
        expect(Object.keys(rows).sort()).toEqual([...drugs].sort());
        await expect(
            page.getByText(/The form is full: it holds 30 antibiotic results per species/)
        ).toBeVisible();
        await expect(drugRow(page, SEVENTIETH)).toHaveCount(0);
    });

    test("saves each result in the same slot as its antibiotic (save intercepted, nothing sent)", async () => {
        const expected = await readDrugRows(page);
        await page
            .getByRole("row", { name: /CRL ID/ })
            .getByRole("textbox")
            .fill("E2E-TEST");

        const saved = interceptSave(page);
        await page.getByRole("button", { name: "Save" }).click();
        const payload = await saved;

        const pairs = await readSavedSlots(page, payload, CENTRAL_REF_LAB_PROGRAM);
        log(`SAVED_SLOTS ${pairs.length} ${JSON.stringify(pairs.slice(0, 3))}`);

        expect(
            pairs.filter(pair => !pair.antibiotic),
            "results saved without an antibiotic"
        ).toEqual([]);
        expect(pairs.map(pair => pair.antibiotic).sort()).toEqual(Object.keys(expected).sort());
        expect(
            pairs.every(pair => pair.result === "S"),
            "every result is the one entered"
        ).toBe(true);
    });
});

test("a saved form shows every saved antibiotic with its result", async ({ page }) => {
    const trackedEntity = await openSavedCentralRefLab(page, "View");
    const saved = await getSavedAntibioticsByStage(page, CENTRAL_REF_LAB_PROGRAM, trackedEntity);
    const shown = await readDrugRowsByStage(page);
    const missing = Object.entries(saved).flatMap(([stage, drugs]) =>
        drugs.filter(drug => !shown[stage]?.[drug]).map(drug => `${stage}: ${drug}`)
    );
    const warnings = await page.getByText(/saved result\(s\) cannot be shown/).allInnerTexts();
    log(
        `RECORD ${trackedEntity} SAVED ${JSON.stringify(saved)} SHOWN ${JSON.stringify(
            Object.fromEntries(
                Object.entries(shown).map(([stage, rows]) => [
                    stage,
                    Object.entries(rows).filter(([, r]) => r),
                ])
            )
        )} MISSING ${JSON.stringify(missing)} WARNINGS ${JSON.stringify(warnings)}`
    );

    expect(Object.keys(saved).length, "species stages with saved antibiotics").toBeGreaterThan(0);
    expect(missing, "saved antibiotics with no result shown in their own stage").toEqual([]);
    await expect(page.getByText(/saved result\(s\) cannot be shown/)).toHaveCount(0);
});

test("a saved form takes a new result in a free slot and keeps every earlier result (save intercepted)", async ({
    page,
}) => {
    const trackedEntity = await openSavedCentralRefLab(page, "Edit");
    const before = await getSavedAntibioticsByStage(page, CENTRAL_REF_LAB_PROGRAM, trackedEntity);
    const firstStage = Object.keys(await readDrugRowsByStage(page))[0] ?? "";
    const rows = (await readDrugRowsByStage(page))[firstStage] ?? {};
    const newDrug = Object.keys(rows).find(drug => !rows[drug]);
    expect(newDrug, `a drug without a result in ${firstStage}`).toBeTruthy();
    if (!newDrug) return;

    await enterResult(page, newDrug, "Resistant");
    const saved = interceptSave(page);
    await page.getByRole("button", { name: "Save" }).click();
    const pairs = await readSavedSlots(page, await saved, CENTRAL_REF_LAB_PROGRAM);
    log(`ADDED ${firstStage}: ${newDrug} SAVED_SLOTS ${pairs.length}`);

    expect(
        pairs.filter(pair => !pair.antibiotic),
        "results saved without an antibiotic"
    ).toEqual([]);
    expect(pairs.map(pair => pair.antibiotic).sort()).toEqual(
        [...Object.values(before).flat(), newDrug].sort()
    );
    expect(pairs.find(pair => pair.antibiotic === newDrug && pair.result === "R")).toBeTruthy();
});
