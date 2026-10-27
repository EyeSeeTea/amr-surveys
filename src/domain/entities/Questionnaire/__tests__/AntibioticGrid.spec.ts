import { describe, expect, it } from "vitest";
import { buildAntibioticGrid } from "../AntibioticGrid";
import { drugNames, loadedSlots, slots } from "./antibioticSlotFixtures";

const DRUGS = drugNames(40);

describe("buildAntibioticGrid", () => {
    it("returns an empty grid until the drugs and the slots are known", () => {
        expect(buildAntibioticGrid(undefined, slots(2, DRUGS)).rows).toEqual([]);
        expect(buildAntibioticGrid(DRUGS, undefined).rows).toEqual([]);
        expect(buildAntibioticGrid(DRUGS, []).rows).toEqual([]);
    });

    it("shows every drug of a group longer than the number of slots, all pointing at the first free slot", () => {
        const formSlots = slots(30, DRUGS);
        const grid = buildAntibioticGrid(DRUGS, formSlots);

        expect(grid.rows.map(row => row.option)).toEqual(DRUGS);
        expect(grid.rows.every(row => row.slot === formSlots[0])).toBe(true);
        expect(grid).toMatchObject({
            capacity: 30,
            notShown: [],
            unknown: [],
            hiddenSavedCount: 0,
        });
    });

    it("finds saved results by antibiotic, not by position", () => {
        const formSlots = slots(3, DRUGS, {
            1: { antibiotic: "Drug 35", result: "Resistant" },
            2: { antibiotic: "Drug 01", result: "Susceptible" },
        });
        const grid = buildAntibioticGrid(DRUGS, formSlots);
        const slotOf = (drug: string) => grid.rows.find(row => row.option === drug)?.slot;

        expect(slotOf("Drug 35")).toBe(formSlots[0]);
        expect(slotOf("Drug 01")).toBe(formSlots[1]);
        expect(slotOf("Drug 02")).toBe(formSlots[2]);
    });

    it("counts a slot with only a value (no result) as used", () => {
        const formSlots = slots(2, DRUGS, { 1: { antibiotic: "Drug 05", value: "12 mm" } });
        const grid = buildAntibioticGrid(DRUGS, formSlots);

        expect(grid.rows.find(row => row.option === "Drug 05")?.slot).toBe(formSlots[0]);
        expect(grid.rows.find(row => row.option === "Drug 06")?.slot).toBe(formSlots[1]);
    });

    it("keeps saved drugs that are no longer in the group, after the group's drugs", () => {
        const formSlots = slots(2, [...DRUGS, "Retired drug"], {
            1: { antibiotic: "Retired drug", result: "Susceptible" },
        });
        const grid = buildAntibioticGrid(DRUGS.slice(0, 2), formSlots);

        expect(grid.rows.map(row => row.option)).toEqual(["Drug 01", "Drug 02", "Retired drug"]);
        expect(grid.rows[2]?.slot).toBe(formSlots[0]);
    });

    it("lists the drugs that cannot be added once every slot is used", () => {
        const formSlots = slots(2, DRUGS, {
            1: { antibiotic: "Drug 01", result: "Susceptible" },
            2: { antibiotic: "Drug 02", result: "Resistant" },
        });
        const grid = buildAntibioticGrid(DRUGS.slice(0, 4), formSlots);

        expect(grid.rows.map(row => row.option)).toEqual(["Drug 01", "Drug 02"]);
        expect(grid.notShown).toEqual(["Drug 03", "Drug 04"]);
        expect(grid.capacity).toBe(2);
    });

    it("reports drugs of the group that are missing from the antibiotic option set, without a row", () => {
        const grid = buildAntibioticGrid(["Drug 01", "Typo drug"], slots(2, DRUGS));

        expect(grid.rows.map(row => row.option)).toEqual(["Drug 01"]);
        expect(grid.unknown).toEqual(["Typo drug"]);
    });

    it("reports saved results that cannot be shown instead of dropping them silently", () => {
        const formSlots = slots(4, DRUGS, {
            1: { result: "Resistant" }, // no antibiotic saved with it
            2: { antibiotic: "Drug 01", result: "Susceptible" },
            3: { antibiotic: "Drug 01", result: "Resistant" }, // same antibiotic saved twice
        });
        const grid = buildAntibioticGrid(DRUGS, formSlots);

        expect(grid.hiddenSavedCount).toBe(2);
        expect(grid.rows.find(row => row.option === "Drug 01")?.slot).toBe(formSlots[1]);
        expect(grid.rows.find(row => row.option === "Drug 02")?.slot).toBe(formSlots[3]);
    });

    it("treats the empty options of a reopened record as free slots", () => {
        const formSlots = loadedSlots(3, DRUGS, {
            2: { antibiotic: "Drug 07", result: "Resistant" },
        });
        const grid = buildAntibioticGrid(DRUGS, formSlots);

        expect(grid.rows.find(row => row.option === "Drug 07")?.slot).toBe(formSlots[1]);
        expect(grid.rows.find(row => row.option === "Drug 01")?.slot).toBe(formSlots[0]);
        expect(grid).toMatchObject({ notShown: [], hiddenSavedCount: 0 });
    });
});
