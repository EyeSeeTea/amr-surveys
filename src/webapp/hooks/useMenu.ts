import i18n from "@eyeseetea/feedback-component/locales";
import { useCallback, useEffect, useState } from "react";
import { AMRSurveyModule } from "../../domain/entities/AMRSurveyModule";
import { getBaseSurveyFormType } from "../../domain/utils/menuHelper";
import { useAppContext } from "../contexts/app-context";

export interface MenuGroup {
    kind: "MenuGroup";
    title: string;
    moduleColor: string;
    icon?: string;
    children?: MenuLeaf[];
}

export interface MenuLeaf {
    kind: "MenuLeaf";
    title: string;
    path: string;
    icon?: any;
    module: AMRSurveyModule;
}

export type Menu = MenuGroup | MenuLeaf;

export function useMenu() {
    const {
        compositionRoot,
        currentUser: { userGroups },
    } = useAppContext();
    const [menu, setMenu] = useState<Menu[]>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const mapModuleToMenu = useCallback(
        (modules: AMRSurveyModule[]): Menu[] => {
            return modules.map(m => {
                const surveyFormType = getBaseSurveyFormType(m, userGroups);
                const childMenus: MenuLeaf[] = [
                    {
                        kind: "MenuLeaf",
                        title: "Surveys",
                        path: `/surveys/${surveyFormType}`,
                        module: m,
                    },
                ];
                return {
                    kind: "MenuGroup",
                    title: m.name,
                    moduleColor: m.color,
                    children: childMenus,
                };
            });
        },
        [userGroups]
    );

    useEffect(() => {
        setLoading(true);
        compositionRoot.modules.getAllAccessible.execute(userGroups).run(
            modules => {
                const parsedMenu = mapModuleToMenu(modules);
                setMenu(parsedMenu);
                setLoading(false);
            },
            err => {
                setError(i18n.t(err.message));
                setLoading(false);
            }
        );
    }, [compositionRoot.modules.getAllAccessible, userGroups, mapModuleToMenu]);

    return { menu, loading, error };
}
