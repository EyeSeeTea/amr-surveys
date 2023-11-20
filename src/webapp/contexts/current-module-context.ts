import { useContext, createContext } from "react";
import { AMRSurveyModule } from "../../domain/entities/AMRSurveyModule";

export interface CurrentModuleContextProps {
    currentModule: AMRSurveyModule | undefined;
    changeCurrentModule: (module: AMRSurveyModule) => void;
    resetCurrentModule: () => void;
}

export const CurrentModuleContext = createContext<CurrentModuleContextProps>({
    currentModule: undefined,
    changeCurrentModule: () => {},
    resetCurrentModule: () => {},
});

export function useCurrentModule() {
    const context = useContext(CurrentModuleContext);
    if (context) {
        return context;
    } else {
        throw new Error("Current module context uninitialized");
    }
}
