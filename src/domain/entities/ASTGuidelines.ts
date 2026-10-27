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

const normaliseGroupName = (name: string) => name.trim().toLowerCase();

/**
 * The antibiotics for a species group. The lists and the matrix are maintained by hand in
 * the datastore and name each group separately, so an exact match is tried first and then
 * one ignoring case and surrounding spaces: a stray capital or trailing space must not
 * leave a group with no antibiotics.
 */
export function getGroupAntibiotics(
    matrix: ASTGuidelineMap,
    groupName: Pathogen
): Antibiotics | undefined {
    const exact = matrix.get(groupName);
    if (exact) return exact;

    const wanted = normaliseGroupName(groupName);
    return [...matrix].find(([name]) => normaliseGroupName(name) === wanted)?.[1];
}
