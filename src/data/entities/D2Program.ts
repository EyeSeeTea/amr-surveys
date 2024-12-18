import { Id } from "../../domain/entities/Ref";
import { Codec, Schema } from "../../utils/codec";

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
    sortOrder?: number | undefined;
}

export const ProgramDataElementModel: Codec<ProgramDataElement> = Schema.object({
    code: Schema.string,
    id: Schema.string,
    name: Schema.string,
    formName: Schema.string,
    valueType: Schema.string,
    optionSet: Schema.optional(Schema.object({ id: Schema.string })),
    sortOrder: Schema.optional(Schema.number),
});

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
    sortOrder: number;
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

export interface ProgramTrackedEntityAttibute {
    trackedEntityAttribute: { id: string };
    sortOrder: number;
}
export interface ProgramMetadata {
    programs: Program[];
    programStageDataElements: ProgramStageDataElement[];
    programStageSections?: ProgramStageSection[];
    dataElements: ProgramDataElement[];
    optionSets: OptionSet[];
    options: Option[];
    trackedEntityAttributes?: TrackedEntityAttibute[];
    programTrackedEntityAttributes: ProgramTrackedEntityAttibute[];
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
    trackedEntityAttribute?: {
        id: Id;
    };
}

export interface D2ProgramRuleAction {
    id: Id;
    programRuleActionType: ProgramRuleActionType;
    dataElement?: {
        id: Id | undefined;
    };
    trackedEntityAttribute: {
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
