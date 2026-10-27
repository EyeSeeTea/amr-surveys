import { AntibioticSection } from "./QuestionnaireSection";

export interface AntibioticGridRow {
    option: string;
    slot: AntibioticSection;
}

export interface AntibioticGrid {
    rows: AntibioticGridRow[];
    /** How many antibiotic results the species stage can hold (its number of slots). */
    capacity: number;
    /** Drugs of the group that cannot be added because every slot is used. */
    notShown: string[];
    /** Drugs of the group missing from the antibiotic option set: their results could not be saved. */
    unknown: string[];
    /** Saved results with no row: saved without an antibiotic, or a second result for the same one. */
    hiddenSavedCount: number;
}

const emptyGrid: AntibioticGrid = {
    rows: [],
    capacity: 0,
    notShown: [],
    unknown: [],
    hiddenSavedCount: 0,
};

// A drop-down loaded without a saved value holds an empty option ({ id: "", name: "", code: "" }),
// so a selection counts only when it has a code.
const isSlotUsed = (slot: AntibioticSection): boolean =>
    Boolean(
        slot.antibioticQuestion.value?.code ||
            slot.astResultsQuestion.value?.code ||
            slot.valueQuestion.value
    );

/**
 * Match each drug of the species group to the slot where its result is saved. A drug already saved
 * keeps its slot (found by the saved antibiotic, not by position). Drugs with no result yet share the
 * first free slot, which is where the next result entered is stored. Saved drugs that are no longer
 * in the group stay visible. Anything that cannot be shown or saved is reported, never dropped silently.
 */
export function buildAntibioticGrid(
    options: string[] | undefined,
    slots: AntibioticSection[] | undefined
): AntibioticGrid {
    if (!options || !slots || slots.length === 0) return emptyGrid;

    const slotBySavedName = new Map<string, AntibioticSection>();
    slots.forEach(slot => {
        const savedName = slot.antibioticQuestion.value?.name;
        if (savedName && !slotBySavedName.has(savedName)) slotBySavedName.set(savedName, slot);
    });
    const freeSlot = slots.find(slot => !isSlotUsed(slot));
    const knownNames = new Set(slots[0]?.antibioticQuestion.options.map(option => option.name));

    const rows: AntibioticGridRow[] = [];
    const notShown: string[] = [];
    const unknown: string[] = [];
    options.forEach(option => {
        const savedSlot = slotBySavedName.get(option);
        if (savedSlot) rows.push({ option, slot: savedSlot });
        else if (!knownNames.has(option)) unknown.push(option);
        else if (freeSlot) rows.push({ option, slot: freeSlot });
        else notShown.push(option);
    });

    const optionSet = new Set(options);
    slotBySavedName.forEach((slot, savedName) => {
        if (!optionSet.has(savedName)) rows.push({ option: savedName, slot });
    });

    const shownSlots = new Set(rows.map(row => row.slot));
    const hiddenSavedCount = slots.filter(slot => isSlotUsed(slot) && !shownSlots.has(slot)).length;

    return { rows, capacity: slots.length, notShown, unknown, hiddenSavedCount };
}
