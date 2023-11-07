export type ImportStrategy = "CREATE" | "UPDATE" | "CREATE_AND_UPDATE" | "DELETE";

export interface EventProgram {
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
    dataElements: { id: string }[];
}

export interface EventProgramDataElement {
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

export interface EventProgramMetadata {
    programs: EventProgram[];
    programStageDataElements: ProgramStageDataElement[];
    programStageSections?: ProgramStageSection[];
    dataElements: EventProgramDataElement[];
    optionSets: OptionSet[];
    options: Option[];
}
