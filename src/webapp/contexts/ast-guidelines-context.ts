import { createContext, useContext } from "react";
import { CurrentASTGuidelines } from "../../domain/entities/ASTGuidelines";

export interface CurrentASTGuidelinesContextProps {
    currentASTGuidelines: CurrentASTGuidelines;
    changeCurrentASTGuidelines: (astGuidelines: CurrentASTGuidelines) => void;
}

export const ASTGuidelinesContext = createContext<CurrentASTGuidelinesContextProps | null>(null);

export function useASTGuidelinesContext() {
    const context = useContext(ASTGuidelinesContext);
    if (context) {
        return context;
    } else {
        throw new Error("AST Guidelines context uninitialized");
    }
}
