import { describe, expect, it } from "vitest";
import { getGroupAntibiotics } from "../ASTGuidelines";

describe("getGroupAntibiotics", () => {
    const matrix = new Map([
        ["Viridans group streptococci", ["Penicillin", "Ceftriaxone"]],
        ["Bacteroides ", ["Metronidazole"]],
        ["HACEK", ["Ampicillin"]],
    ]);

    it("finds a group by its exact name", () => {
        expect(getGroupAntibiotics(matrix, "HACEK")).toEqual(["Ampicillin"]);
    });

    it("ignores a difference in capitals", () => {
        expect(getGroupAntibiotics(matrix, "Viridans group Streptococci")).toEqual([
            "Penicillin",
            "Ceftriaxone",
        ]);
    });

    it("ignores a trailing space in either name", () => {
        expect(getGroupAntibiotics(matrix, "Bacteroides")).toEqual(["Metronidazole"]);
        expect(
            getGroupAntibiotics(new Map([["Corynebacterium", ["X"]]]), "Corynebacterium ")
        ).toEqual(["X"]);
    });

    it("returns undefined for a group that is genuinely absent", () => {
        expect(getGroupAntibiotics(matrix, "Nonexistent group")).toBeUndefined();
    });
});
