export type ImportStrategy = "CREATE" | "UPDATE" | "CREATE_AND_UPDATE" | "DELETE";

export interface Program {
    code: string;
    id: string;
    name: string;
}

export interface ProgramStageDataElement {
    id: string;
    dataElement: { id: string };
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
}
