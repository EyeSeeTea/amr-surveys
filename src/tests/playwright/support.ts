/* Helpers for the browser tests: reaching the Prevalence lab forms by clicking, as users do (the forms depend on
   the survey, facility and patient chosen on the way), and reading or filling the antibiotic grid. */
import { expect, Locator, Page, Request, Route } from "@playwright/test";

/** Survey, facility and patient on PREPROD (a weekly copy of production) with the data each test needs. */
export const places = {
    malawi: {
        survey: "MALAWI AMR SURVEY",
        facility: "Balaka District Hospital",
        patient: "HF068/W02/015",
    },
    // Kyrgyzstan uses its own copy of the CLSI lists; this facility has saved Central Ref Lab results.
    kyrgyzstan: { survey: "KYRGYZSTAN - AMR SURVEY", facility: "City Perinatal Center (CPC)" },
} as const;

export const CENTRAL_REF_LAB_PROGRAM = "aaAzYmn5vBG";

export async function waitForIdle(page: Page, timeout = 120_000) {
    await expect(page.locator('[role="progressbar"]:visible')).toHaveCount(0, { timeout });
}

async function openRowMenu(row: Locator) {
    await row.getByRole("button").click();
}

/** Survey list > survey > List Facilities > facility > List Patients. */
export async function openPatients(page: Page, place: { survey: string; facility: string }) {
    await page.goto("#/surveys/PrevalenceSurveyForm");
    await openRowMenu(page.getByRole("row", { name: place.survey }));
    await page.getByRole("menuitem", { name: /List Facilities/ }).click();
    await openRowMenu(page.getByRole("row", { name: place.facility }));
    await page.getByRole("menuitem", { name: /List Patients/ }).click();
}

/** Patient menu > Shipments and Lab results > item (a submenu that opens on hover). */
export async function openLabItem(page: Page, patientRow: Locator, item: string | RegExp) {
    await openRowMenu(patientRow);
    await page.getByRole("menuitem", { name: /Shipments and Lab results/ }).hover();
    await page.getByRole("menuitem", { name: item }).click();
}

/** Waits until the form is drawn and idle; returns the milliseconds since `startedAt`. */
export async function waitForForm(page: Page, startedAt: number): Promise<number> {
    await expect(page.getByText("Stage - Species 1")).toBeVisible();
    await waitForIdle(page);
    return Date.now() - startedAt;
}

// The Supranational form labels the field "Specify the specie".
const speciesInput = (page: Page, stage = 0) =>
    page
        .getByRole("row", { name: /Specify the specie/ })
        .nth(stage)
        .getByRole("combobox");

export async function chooseSpecies(page: Page, species: string, stage = 0) {
    const input = speciesInput(page, stage);
    await input.click();
    await input.fill(species);
    await page.getByRole("option", { name: species, exact: true }).click();
    await expect(input).toHaveValue(species);
}

/** The grid row of a drug (its name, result drop-down and value box). */
export const drugRow = (page: Page, drug: string, nth = 0) =>
    page.getByRole("group", { name: drug, exact: true }).nth(nth);

/**
 * Chooses a result for a drug and waits until the grid shows it; returns how long that took in ms.
 * `nth` picks the drug's row in a later species stage when several stages list it (0 = first).
 */
export async function enterResult(
    page: Page,
    drug: string,
    result: string,
    nth = 0
): Promise<number> {
    const input = drugRow(page, drug, nth).getByRole("combobox");
    await input.click();
    const started = Date.now();
    await page.getByRole("option", { name: result, exact: true }).click();
    await expect(drugRow(page, drug, nth).getByRole("combobox")).toHaveValue(result);
    return Date.now() - started;
}

/** Opens the first Central Ref Lab record of the first patient with one, in View or Edit. */
export async function openSavedCentralRefLab(page: Page, mode: "View" | "Edit") {
    await openPatients(page, places.kyrgyzstan);
    // Any patient with Central Ref Lab results (the 4th column counts them).
    const patientsWithResults = page
        .locator("tbody tr")
        .filter({ has: page.locator("td:nth-child(4)", { hasText: /^[1-9]/ }) });
    await openLabItem(page, patientsWithResults.first(), /List Central Ref Labs Results/);
    await page.locator("tbody tr").first().getByRole("button").click();
    await page.getByRole("menuitem", { name: mode }).click();
    await waitForForm(page, Date.now());
    return page.url().split("/").pop() ?? "";
}

/** Slot -> antibiotic and result codes found in a tracker save payload. */
export async function readSavedSlots(page: Page, payload: unknown, programId: string) {
    const layout = await getSlotLayout(page, programId);
    const slots = new Map<string, { antibiotic?: string; result?: string }>();
    collectDataValues(payload).forEach(({ dataElement, value }) => {
        const place = layout.get(dataElement);
        if (!place || place.role === "value" || !value) return;
        slots.set(place.slot, { ...slots.get(place.slot), [place.role]: value });
    });
    return [...slots.values()];
}

/** Stage title ("Species 1") -> drug -> result shown in its drop-down, for every grid row on the page. */
export async function readDrugRowsByStage(
    page: Page
): Promise<Record<string, Record<string, string>>> {
    return page.evaluate(() => {
        const byStage: Record<string, Record<string, string>> = {};
        let stage = "";
        // Stage headings and rows in page order: each row belongs to the last heading before it.
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const element = node as HTMLElement;
            const heading = /^Stage - (.+)$/.exec(
                element.childElementCount === 0 ? element.innerText?.trim() : ""
            );
            if (heading?.[1]) stage = heading[1];
            const drug =
                element.getAttribute("role") === "group"
                    ? element.getAttribute("aria-label")
                    : null;
            const input = drug
                ? element.querySelector<HTMLInputElement>("input[role=combobox]")
                : null;
            if (drug && input) (byStage[stage] ??= {})[drug] = input.value;
        }
        return byStage;
    });
}

/** Drug -> result shown in its drop-down, for a form with one species chosen (rows of every stage merged). */
export async function readDrugRows(page: Page): Promise<Record<string, string>> {
    return Object.assign({}, ...Object.values(await readDrugRowsByStage(page)));
}

const get = async <T>(page: Page, path: string): Promise<T> => {
    const response = await page.request.get(`/dhis2/api/${path}`);
    expect(response.ok(), path).toBe(true);
    return (await response.json()) as T;
};

type DataValue = { dataElement: string; value: string };

/** Stage name ("Species 1") -> antibiotic names saved on a tracked entity's events, read from DHIS2. */
export async function getSavedAntibioticsByStage(
    page: Page,
    programId: string,
    trackedEntity: string
): Promise<Record<string, string[]>> {
    const layout = await getSlotLayout(page, programId);
    const { programStages } = await get<{ programStages: { id: string; name: string }[] }>(
        page,
        `programs/${programId}?fields=programStages[id,name]`
    );
    const stageName = new Map(programStages.map(stage => [stage.id, stage.name]));
    const { events } = await get<{ events: { programStage: string; dataValues: DataValue[] }[] }>(
        page,
        `tracker/events?trackedEntity=${trackedEntity}&program=${programId}&fields=programStage,dataValues[dataElement,value]&paging=false`
    );
    const byStage: Record<string, string[]> = {};
    events.forEach(event => {
        const antibiotics = event.dataValues
            .filter(dv => dv.value && layout.get(dv.dataElement)?.role === "antibiotic")
            .map(dv => dv.value);
        if (antibiotics.length) {
            const stage = stageName.get(event.programStage) ?? event.programStage;
            byStage[stage] = [...(byStage[stage] ?? []), ...antibiotics];
        }
    });
    return byStage;
}

export type SlotRole = "antibiotic" | "result" | "value";

/** Data element id -> its slot (program stage section) and its role in the slot. */
export async function getSlotLayout(page: Page, programId: string) {
    const { programStages } = await get<{
        programStages: {
            programStageSections: { id: string; dataElements: { id: string; name: string }[] }[];
        }[];
    }>(
        page,
        `programs/${programId}?fields=programStages[programStageSections[id,dataElements[id,name]]]`
    );

    const layout = new Map<string, { slot: string; role: SlotRole }>();
    programStages.forEach(stage =>
        stage.programStageSections.forEach(section =>
            section.dataElements.forEach(de => {
                const role: SlotRole | undefined = de.name.startsWith("Specify the antibiotic")
                    ? "antibiotic"
                    : de.name.startsWith("AST results")
                    ? "result"
                    : de.name.startsWith("Value (unit)")
                    ? "value"
                    : undefined;
                if (role) layout.set(de.id, { slot: section.id, role });
            })
        )
    );
    return layout;
}

/** All data values anywhere in a tracker payload (tracked entities > enrollments > events, or events). */
export function collectDataValues(payload: unknown): DataValue[] {
    if (Array.isArray(payload)) return payload.flatMap(collectDataValues);
    if (!payload || typeof payload !== "object") return [];
    const values = (payload as { dataValues?: DataValue[] }).dataValues ?? [];
    return [...values, ...Object.values(payload).flatMap(collectDataValues)];
}

/**
 * Catches the next save (POST to the tracker API) in the browser and answers it with a made-up success,
 * so nothing reaches DHIS2. Returns the request body the app tried to send.
 */
export function interceptSave(page: Page): Promise<unknown> {
    return new Promise(resolve => {
        const handler = async (route: Route, request: Request) => {
            if (request.method() !== "POST") return route.continue();
            await page.unroute("**/dhis2/api/tracker**", handler);
            resolve(request.postDataJSON());
            const report = { objectReports: [{ uid: "E2eFakeUid1" }] };
            await route.fulfill({
                json: {
                    status: "OK",
                    bundleReport: { typeReportMap: { TRACKED_ENTITY: report, EVENT: report } },
                },
            });
        };
        page.route("**/dhis2/api/tracker**", handler);
    });
}
