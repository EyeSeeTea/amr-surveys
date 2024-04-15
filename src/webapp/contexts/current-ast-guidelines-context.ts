import { createContext, useContext } from "react";
import { CurrentASTGuidelines } from "../../domain/entities/ASTGuidelines";

export interface CurrentASTGuidelinesContextProps {
    currentASTGuidelines: CurrentASTGuidelines;
    changeCurrentASTGuidelines: (astGuidelines: CurrentASTGuidelines) => void;
}

export const currentASTGuidelinesContext = createContext<CurrentASTGuidelinesContextProps | null>(
    null
);

export function useCurrentASTGuidelinesContext() {
    const context = useContext(currentASTGuidelinesContext);
    if (context) {
        return context;
    } else {
        throw new Error("Current AST Guidelines context uninitialized");
    }
}
