import { Id } from "./Ref";

type Pathogen = string;
type Antibiotics = string[];
type ASTGuidelineMap = Map<Pathogen, Antibiotics>;

export type ASTGUIDELINE_TYPES = "EUCAST" | "CLSI" | "CUSTOM";

type CLSIASTGuidelines = {
    type: "CLSI";
    lists: ASTGuidelineMap;
    matrix: ASTGuidelineMap;
};

type EUCASTASTGuidelines = {
    type: "EUCAST";
    lists: ASTGuidelineMap;
    matrix: ASTGuidelineMap;
};
type CustomAstGuidelines = {
    type: "CUSTOM";
    surveyId: Id;
    lists: ASTGuidelineMap;
    matrix: ASTGuidelineMap;
};

export type CurrentASTGuidelines = CLSIASTGuidelines | EUCASTASTGuidelines | CustomAstGuidelines;
