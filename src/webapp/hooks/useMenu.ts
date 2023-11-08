import { useSnackbar } from "@eyeseetea/d2-ui-components";
import i18n from "@eyeseetea/feedback-component/locales";
import { useEffect, useState } from "react";
import { AMRSurveyModule } from "../../domain/entities/AMRSurveyModule";
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
    const snackbar = useSnackbar();

    const mapModuleToMenu = (modules: AMRSurveyModule[]): Menu[] => {
        return modules.map(m => {
            const childMenus: MenuLeaf[] = [
                {
                    kind: "MenuLeaf",
                    title: "Surveys",
                    path: `/surveys/PPSSurveyForm`,
                },
            ];

            return {
                kind: "MenuGroup",
                title: m.name,
                moduleColor: m.color,
                children: childMenus,
            };
        });
    };

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
    }, [compositionRoot.modules.getAllAccessible, userGroups, snackbar]);

    return { menu, loading, error };
}
