import { PropsWithChildren, useEffect, useState } from "react";
import { AMRSurveyModule } from "../../domain/entities/AMRSurveyModule";
import { CurrentModuleContext } from "./current-module-context";

export const CurrentModuleContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [currentModule, setCurrentModule] = useState<AMRSurveyModule | undefined>();

    useEffect(() => {
        const module = window.sessionStorage.getItem("currentModule");
        if (module && !currentModule) {
            setCurrentModule(JSON.parse(module));
        }
    }, [currentModule]);

    const changeCurrentModule = (module: AMRSurveyModule | undefined) => {
        setCurrentModule(module);
        window.sessionStorage.setItem("currentModule", JSON.stringify(module));
    };

    const resetCurrentModule = () => {
        setCurrentModule(undefined);
        window.sessionStorage.removeItem("currentModule");
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
