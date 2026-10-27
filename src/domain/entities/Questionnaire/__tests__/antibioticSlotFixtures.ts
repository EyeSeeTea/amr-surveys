// Test data for the antibiotic grid: species stages with numbered antibiotic slots, built like the
// Central Reference Lab program (one section per slot: antibiotic, AST result, value).
import { QuestionnaireStage } from "../Questionnaire";
import {
    ASTResultsQuestion,
    AntibioticQuestion,
    AntibioticValueQuestion,
    QuestionOption,
    SpeciesQuestion,
} from "../QuestionnaireQuestion";
import { AntibioticSection, QuestionnaireSection } from "../QuestionnaireSection";

export const option = (name: string): QuestionOption => ({ id: `id-${name}`, name, code: name });

export const AST_OPTIONS = [option("Susceptible"), option("Resistant")];

/** Drug names "Drug 01" ... "Drug nn", in order, as a guideline group lists them. */
export const drugNames = (count: number): string[] =>
    Array.from({ length: count }, (_, i) => `Drug ${String(i + 1).padStart(2, "0")}`);

const base = { isVisible: true, sortOrder: undefined, errors: [] };

export interface SavedSlot {
    antibiotic?: string;
    result?: string;
    value?: string;
}

// How a saved record loads an empty drop-down (questionHelper getSelectQuestionBase).
export const LOADED_EMPTY_OPTION = { id: "", name: "", code: "" };

/** Slots as a reopened record loads them: empty drop-downs hold an empty option, empty texts "". */
export function loadedSlots(
    count: number,
    knownDrugs: string[],
    saved: Record<number, SavedSlot> = {}
) {
    return slots(count, knownDrugs, saved).map(s => ({
        antibioticQuestion: {
            ...s.antibioticQuestion,
            value: s.antibioticQuestion.value ?? LOADED_EMPTY_OPTION,
        },
        astResultsQuestion: {
            ...s.astResultsQuestion,
            value: s.astResultsQuestion.value ?? LOADED_EMPTY_OPTION,
        },
        valueQuestion: { ...s.valueQuestion, value: s.valueQuestion.value ?? "" },
    }));
}

export function slot(
    index: number,
    knownDrugs: string[],
    saved: SavedSlot = {}
): AntibioticSection {
    const antibioticQuestion: AntibioticQuestion = {
        ...base,
        id: `abx-${index}`,
        code: `abx-${index}`,
        name: `Specify the antibiotic${index}`,
        text: "Specify the antibiotic",
        type: "select",
        subType: "select-antibiotic",
        options: knownDrugs.map(option),
        value: saved.antibiotic ? option(saved.antibiotic) : undefined,
    };
    const astResultsQuestion: ASTResultsQuestion = {
        ...base,
        id: `ast-${index}`,
        code: `ast-${index}`,
        name: `AST results${index}`,
        text: "AST results",
        type: "select",
        subType: "select-ast-results",
        options: AST_OPTIONS,
        value: saved.result ? option(saved.result) : undefined,
    };
    const valueQuestion: AntibioticValueQuestion = {
        ...base,
        id: `val-${index}`,
        code: `val-${index}`,
        name: `Value (unit)${index}`,
        text: "Value (unit)",
        type: "text",
        subType: "text-antibiotic-value",
        multiline: false,
        value: saved.value,
    };
    return { antibioticQuestion, astResultsQuestion, valueQuestion };
}

export function slots(count: number, knownDrugs: string[], saved: Record<number, SavedSlot> = {}) {
    return Array.from({ length: count }, (_, i) => slot(i + 1, knownDrugs, saved[i + 1]));
}

const section = (
    code: string,
    questions: QuestionnaireSection["questions"],
    kind: "species" | "antibiotic"
) => ({
    title: code,
    code,
    questions,
    isVisible: true,
    sortOrder: 0,
    stageId: "stage-species-1",
    isSpeciesSection: kind === "species",
    isAntibioticSection: kind === "antibiotic",
    isAntibioticTreatmentHospitalEpisodeSection: false,
});

export function speciesQuestion(species?: string): SpeciesQuestion {
    return {
        ...base,
        id: "species-1",
        code: "species-1",
        name: "Specify the species",
        text: "Specify the species",
        type: "select",
        subType: "select-species",
        options: [option("Klebsiella pneumoniae"), option("Staphylococcus aureus")],
        value: species ? option(species) : undefined,
    };
}

/** A species stage: the species section followed by one section per antibiotic slot. */
export function speciesStage(antibioticSlots: AntibioticSection[], species?: string) {
    const speciesSection: QuestionnaireSection = section(
        "species",
        [speciesQuestion(species)],
        "species"
    );
    const stage: QuestionnaireStage = {
        id: "stage-species-1",
        title: "Species 1",
        code: "species-1",
        sortOrder: 1,
        isVisible: true,
        repeatable: false,
        sections: [
            speciesSection,
            ...antibioticSlots.map((s, i) =>
                section(
                    `slot-${i + 1}`,
                    [s.antibioticQuestion, s.astResultsQuestion, s.valueQuestion],
                    "antibiotic"
                )
            ),
        ],
    };
    return { speciesSection, stage };
}
