import { Id } from "@eyeseetea/d2-api";

export type ImportStrategy = "CREATE" | "UPDATE" | "CREATE_AND_UPDATE" | "DELETE";
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
    ProgramStageSection: ProgramStageSection[];
}

export interface ProgramDataElement {
    code: string;
    id: string;
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

export interface ProgramRule {
    id: Id;
    condition: string; // eg: "${AMR-Sample 2} != 'NO'"
    dataElementId: Id; // from ProgramRuleVariable
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
        id: Id | undefined; // to hide
    };
    data?: string; // to assign
    programStageSection?: {
        id: Id | undefined; // to hide/show
    };
    programStage?: {
        id: Id | undefined; // to hide/show
    };
    content?: string; // message content to show
}

export type ProgramCountMap = {
    id: string;
    count: number;
}[];

export type ProgramOptionCountMap = {
    option: string;
    count: number;
}[];
