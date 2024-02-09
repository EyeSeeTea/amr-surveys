export type ImportStrategy = "CREATE" | "UPDATE" | "CREATE_AND_UPDATE" | "DELETE";

export type ProgramCountMap = {
    id: string;
    count: number;
}[];

export type ProgramOptionCountMap = {
    option: string;
    count: number;
}[];
