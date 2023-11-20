import { PropsWithChildren, useState } from "react";
import { AMRSurveyModule } from "../../domain/entities/AMRSurveyModule";
import { CurrentModuleContext } from "./current-module-context";

export const CurrentModuleContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [currentModule, setCurrentModule] = useState<AMRSurveyModule | undefined>();

    const changeCurrentModule = (module: AMRSurveyModule | undefined) => {
        setCurrentModule(module);
    };

    const resetCurrentModule = () => {
        setCurrentModule(undefined);
    };

    return (
        <CurrentModuleContext.Provider
            value={{
                currentModule,
                changeCurrentModule,
                resetCurrentModule,
            }}
        >
            {children}
        </CurrentModuleContext.Provider>
    );
};
