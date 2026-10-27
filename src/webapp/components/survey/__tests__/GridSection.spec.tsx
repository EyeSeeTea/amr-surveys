import React, { useCallback, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { GridSection } from "../GridSection";
import { Question } from "../../../../domain/entities/Questionnaire/QuestionnaireQuestion";
import { AntibioticSection } from "../../../../domain/entities/Questionnaire/QuestionnaireSection";
import {
    drugNames,
    loadedSlots,
    option,
    slots,
    speciesStage,
} from "../../../../domain/entities/Questionnaire/__tests__/antibioticSlotFixtures";

// Guideline groups by species: Klebsiella has more drugs than the 30 slots.
const GROUPS: Record<string, string[]> = {
    "Klebsiella pneumoniae": drugNames(40),
    "Staphylococcus aureus": ["Drug 01", "Drug 02", "Drug 03"],
};
const KNOWN_DRUGS = drugNames(40);

// A stable object, as the real hook returns a memoised callback.
const guidelines = {
    getAntibioticOptions: (question: Question) =>
        question.value && typeof question.value === "object" && "name" in question.value
            ? GROUPS[question.value.name]
            : undefined,
};
vi.mock("../../../hooks/useASTGuidelinesOptions", () => ({
    useASTGuidelinesOptions: () => guidelines,
}));

// The species drop-down is the generic form section, tested elsewhere: a button stands in for it.
vi.mock("../SurveySection", () => ({
    SurveySection: (props: { questions: Question[]; updateQuestion: (q: Question) => void }) => (
        <button
            onClick={() =>
                props.updateQuestion({
                    ...props.questions[0],
                    value: option("Staphylococcus aureus"),
                } as Question)
            }
        >
            Change species
        </button>
    ),
}));

/** Keeps the form's state like the survey form does, and records every question saved. */
function renderGrid(antibioticSlots: AntibioticSection[], options: { viewOnly?: boolean } = {}) {
    const saved: Question[] = [];

    const Harness: React.FC = () => {
        const [state, setState] = useState(() =>
            speciesStage(antibioticSlots, "Klebsiella pneumoniae")
        );
        const updateQuestion = useCallback((question: Question) => {
            saved.push(question);
            setState(({ stage }) => {
                const sections = stage.sections.map(section => ({
                    ...section,
                    questions: section.questions.map(q => (q.id === question.id ? question : q)),
                }));
                const speciesSection = sections[0];
                if (!speciesSection) throw new Error("species section missing");
                return { speciesSection, stage: { ...stage, sections } };
            });
        }, []);

        return (
            <GridSection
                speciesSection={state.speciesSection}
                antibioticStage={state.stage}
                updateQuestion={updateQuestion}
                viewOnly={options.viewOnly}
            />
        );
    };

    render(<Harness />);
    return {
        saved,
        lastValueOf: (id: string) => [...saved].reverse().find(q => q.id === id)?.value,
    };
}

const rowOf = (drug: string) => within(screen.getByRole("group", { name: drug }));

function chooseResult(drug: string, result: string) {
    const input = rowOf(drug).getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.click(rowOf(drug).getByRole("option", { name: result }));
}

const nameOf = (value: unknown) => (value as { name?: string } | undefined)?.name;

describe("GridSection (antibiotic results grid)", () => {
    it("shows every drug of a group longer than the number of slots", () => {
        renderGrid(slots(30, KNOWN_DRUGS));

        expect(screen.getAllByRole("group")).toHaveLength(40);
        expect(screen.getByText("Drug 40")).toBeInTheDocument();
    });

    it("saves a result for a drug beyond the 30th in the first free slot, then the next one in the next slot", () => {
        const { lastValueOf } = renderGrid(slots(30, KNOWN_DRUGS));

        chooseResult("Drug 35", "Resistant");
        expect(nameOf(lastValueOf("ast-1"))).toBe("Resistant");
        expect(nameOf(lastValueOf("abx-1"))).toBe("Drug 35");

        chooseResult("Drug 02", "Susceptible");
        expect(nameOf(lastValueOf("ast-2"))).toBe("Susceptible");
        expect(nameOf(lastValueOf("abx-2"))).toBe("Drug 02");
        expect(nameOf(lastValueOf("abx-1"))).toBe("Drug 35");
    });

    it("saves a value typed without a result, with its antibiotic", () => {
        const { lastValueOf } = renderGrid(slots(30, KNOWN_DRUGS));

        fireEvent.change(rowOf("Drug 10").getByRole("textbox"), { target: { value: "14 mm" } });

        expect(lastValueOf("val-1")).toBe("14 mm");
        expect(nameOf(lastValueOf("abx-1"))).toBe("Drug 10");
    });

    it("shows saved results against their own drug and frees the slot when the result is cleared", () => {
        const { lastValueOf } = renderGrid(
            slots(3, KNOWN_DRUGS, { 2: { antibiotic: "Drug 33", result: "Resistant" } })
        );
        expect(rowOf("Drug 33").getByRole("combobox")).toHaveValue("Resistant");
        expect(rowOf("Drug 01").getByRole("combobox")).toHaveValue("");

        fireEvent.click(rowOf("Drug 33").getByTitle("Clear"));

        expect(lastValueOf("ast-2")).toBeUndefined();
        expect(lastValueOf("abx-2")).toBeUndefined();
    });

    it("tells the user which drugs cannot be added when the form is full", () => {
        renderGrid(
            slots(2, KNOWN_DRUGS, {
                1: { antibiotic: "Drug 01", result: "Resistant" },
                2: { antibiotic: "Drug 02", result: "Susceptible" },
            })
        );

        expect(screen.getAllByRole("group")).toHaveLength(2);
        expect(
            screen.getByText(/The form is full: it holds 2 antibiotic results/)
        ).toHaveTextContent("Drug 03, Drug 04");
    });

    it("warns about saved results it cannot show", () => {
        renderGrid(slots(2, KNOWN_DRUGS, { 1: { result: "Resistant" } }));

        expect(screen.getByText(/1 saved result\(s\) cannot be shown/)).toBeInTheDocument();
    });

    it("lets a read-only user see but not change results", () => {
        renderGrid(slots(3, KNOWN_DRUGS, { 1: { antibiotic: "Drug 01", result: "Resistant" } }), {
            viewOnly: true,
        });

        expect(rowOf("Drug 01").getByRole("combobox")).toBeDisabled();
        expect(rowOf("Drug 01").getByRole("textbox")).toBeDisabled();
        expect(rowOf("Drug 02").getByRole("combobox")).toBeDisabled();
    });

    it("clears every entered result when the species changes, and shows the new species' drugs", () => {
        const { lastValueOf } = renderGrid(
            slots(3, KNOWN_DRUGS, {
                1: { antibiotic: "Drug 33", result: "Resistant", value: "8" },
                2: { antibiotic: "Drug 01", result: "Susceptible" },
            })
        );

        fireEvent.click(screen.getByText("Change species"));

        ["abx-1", "ast-1", "val-1", "abx-2", "ast-2"].forEach(id =>
            expect(lastValueOf(id), id).toBeUndefined()
        );
        expect(screen.getAllByRole("group").map(row => row.getAttribute("aria-label"))).toEqual([
            "Drug 01",
            "Drug 02",
            "Drug 03",
        ]);
    });

    it("adds a new result to a reopened record in a free slot, and frees it again when cleared", () => {
        const { lastValueOf } = renderGrid(
            loadedSlots(3, KNOWN_DRUGS, { 1: { antibiotic: "Drug 33", result: "Resistant" } })
        );
        expect(screen.queryByText(/cannot be shown/)).not.toBeInTheDocument();

        chooseResult("Drug 05", "Susceptible");
        expect(nameOf(lastValueOf("abx-2"))).toBe("Drug 05");

        fireEvent.change(rowOf("Drug 05").getByRole("textbox"), { target: { value: "9" } });
        fireEvent.click(rowOf("Drug 05").getByTitle("Clear"));
        expect(nameOf(lastValueOf("abx-2"))).toBe("Drug 05");

        fireEvent.change(rowOf("Drug 05").getByRole("textbox"), { target: { value: "" } });
        expect(lastValueOf("abx-2")).toBeUndefined();
    });
});
