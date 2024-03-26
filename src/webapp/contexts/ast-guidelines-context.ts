import React, { useContext } from "react";

export interface ASTGuidelinesContextState {
    CLSI_lists: Map<string, string[]>;
    CLSI_matrix: Map<string, string[]>;
    EUCAST_lists: Map<string, string[]>;
    EUCAST_matrix: Map<string, string[]>;
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
