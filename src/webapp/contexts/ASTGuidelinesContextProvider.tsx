import { PropsWithChildren, useState } from "react";
import { ASTGuidelinesContext } from "./ast-guidelines-context";
import { CurrentASTGuidelines } from "../../domain/entities/ASTGuidelines";

const defaultASTGuidelines: CurrentASTGuidelines = {
    type: "CLSI",
    lists: new Map(),
    matrix: new Map(),
};

export const ASTGuidelinesContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [currentASTGuidelines, setCurrentASTGuidelines] =
        useState<CurrentASTGuidelines>(defaultASTGuidelines);

    const changeCurrentASTGuidelines = (astGuidelines: CurrentASTGuidelines) => {
        setCurrentASTGuidelines(astGuidelines);
    };

    return (
        <ASTGuidelinesContext.Provider value={{ currentASTGuidelines, changeCurrentASTGuidelines }}>
            {children}
        </ASTGuidelinesContext.Provider>
    );
};
