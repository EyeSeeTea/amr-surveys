/* Prevalence > Supranational Reference Lab form: it uses the same antibiotic grid as the Central Reference Lab.
   No Supranational record on PREPROD has antibiotic results, so only a new form is checked. */
import { expect, test } from "@playwright/test";
import {
    chooseSpecies,
    openLabItem,
    openPatients,
    places,
    readDrugRows,
    waitForForm,
} from "./support";

test("a new form lists every drug of a long group", async ({ page }) => {
    await openPatients(page, places.malawi);
    await openLabItem(
        page,
        page.getByRole("row", { name: places.malawi.patient }),
        "New Supranational Ref Results"
    );
    await waitForForm(page, Date.now());
    await chooseSpecies(page, "Klebsiella pneumoniae");

    const rows = await readDrugRows(page);
    expect(Object.keys(rows)).toHaveLength(72);
    expect(rows["Cefuroxime"]).toBe("");
});
