import { Id } from "../../domain/entities/Ref";
export type ProgramRuleActionType =
    | "DISPLAYTEXT"
    | "DISPLAYKEYVALUEPAIR"
    | "HIDEFIELD"
    | "HIDESECTION"
    | "ASSIGN"
    | "SHOWWARNING"
    | "SHOWERROR"
    | "WARNINGONCOMPLETINON"
    | "ERRORONCOMPLETION"
    | "CREATEEVENT"
    | "SETMANDATORYFIELD";

export interface Program {
    code: string;
    id: string;
    name: string;
}

export interface ProgramStageDataElement {
    id: string;
    dataElement: { id: string };
    sortOrder: number | undefined;
}

export interface ProgramStageSection {
    id: string;
    name: string;
    sortOrder: number;
    dataElements: { id: string }[];
    programStage: { id: string };
}

export interface ProgramStage {
    id: string;
    name: string;
    sortOrder: number;
    repeatable: boolean;
    ProgramStageSection: ProgramStageSection[];
}

export interface ProgramDataElement {
    code: string;
    id: string;
    name: string;
    formName: string;
    valueType: string;
    optionSet?: { id: string };
    sortOrder: number | undefined;
}

export interface OptionSet {
    id: string;
    name: string;
    options: { id: string };
}

export interface Option {
    id: string;
    name: string;
    code: string;
    optionSet: { id: string };
}

export interface TrackedEntityAttibute {
    id: string;
    code: string;
    name: string;
    formName: string;
    sortOrder: number;
    valueType: string;
    optionSet?: { id: string };
    value?: string;
}
export interface ProgramMetadata {
    programs: Program[];
    programStageDataElements: ProgramStageDataElement[];
    programStageSections?: ProgramStageSection[];
    dataElements: ProgramDataElement[];
    optionSets: OptionSet[];
    options: Option[];
    trackedEntityAttributes?: TrackedEntityAttibute[];
    programStages: ProgramStage[];
    programRules: D2ProgramRule[];
    programRuleVariables: D2ProgramRuleVariable[];
    programRuleActions: D2ProgramRuleAction[];
}

export interface D2ProgramRule {
    id: Id;
    condition: string; // eg: "${AMR-Sample 2} != 'NO'"
    programRuleActions: {
        id: Id;
    }[];
}

export interface D2ProgramRuleVariable {
    id: Id;
    name: string;
    dataElement: {
        id: Id;
    };
}

export interface D2ProgramRuleAction {
    id: Id;
    programRuleActionType: ProgramRuleActionType;
    dataElement?: {
        id: Id | undefined;
    };
    data?: string;
    programStageSection?: {
        id: Id | undefined;
    };
    programStage?: {
        id: Id | undefined;
    };
    content?: string;
}
