import { useSnackbar } from "@eyeseetea/d2-ui-components";
import i18n from "@eyeseetea/feedback-component/locales";
import { useEffect, useState } from "react";
import { AMRSurveyModule } from "../../domain/entities/AmrSurveyModule";
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
    const { compositionRoot } = useAppContext();
    const [menu, setMenu] = useState<Menu[]>();
    const snackbar = useSnackbar();

    const mapModuleToMenu = (modules: AMRSurveyModule[]): Menu[] => {
        return modules.map(m => {
            const childMenus: MenuLeaf[] = m.surveyPrograms.map(cm => {
                return { kind: "MenuLeaf", title: cm.name, path: "Survey" };
            });

            return {
                kind: "MenuGroup",
                title: m.name,
                moduleColor: m.color,
                children: childMenus,
            };
        });
    };

    useEffect(() => {
        compositionRoot.modules.getAll.execute().run(
            modules => {
                const parsedMenu = mapModuleToMenu(modules);
                setMenu(parsedMenu);
            },
            err => {
                snackbar.error(i18n.t(err.message));
            }
        );
    }, [compositionRoot.modules.getAll, snackbar]);

    return menu;
}
