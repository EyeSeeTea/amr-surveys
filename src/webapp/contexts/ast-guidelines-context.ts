import React, { useContext } from "react";

type Pathogen = string;
type Antibiotics = string;
type ASTGuidelineMap = Map<Pathogen, Antibiotics[]>;

export interface ASTGuidelinesContextState {
    CLSI_lists: ASTGuidelineMap;
    CLSI_matrix: ASTGuidelineMap;
    EUCAST_lists: ASTGuidelineMap;
    EUCAST_matrix: ASTGuidelineMap;
}

export const ASTGuidelinesContext = React.createContext<ASTGuidelinesContextState | null>(null);

export function useASTGuidelinesContext() {
    const context = useContext(ASTGuidelinesContext);
    if (context) {
        return context;
    } else {
        throw new Error("AST Guidelines context uninitialized");
    }
}
