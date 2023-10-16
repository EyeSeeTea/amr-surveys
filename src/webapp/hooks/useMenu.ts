import { useSnackbar } from "@eyeseetea/d2-ui-components";
import i18n from "@eyeseetea/feedback-component/locales";
import { useEffect, useState } from "react";
import { AMRSurveyModule, SurveyProgram } from "../../domain/entities/AMRSurveyModule";
import { useAppContext } from "../contexts/app-context";
import { useCurrentOrgUnitContext } from "../contexts/current-org-unit-context/current-orgUnit-context";

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
    const snackbar = useSnackbar();
    const { currentOrgUnitAccess } = useCurrentOrgUnitContext();

    const mapModuleToMenu = (modules: AMRSurveyModule[]): Menu[] => {
        return modules.map(m => {
            const childMenus: MenuLeaf[] = m.surveyPrograms.map((cm: SurveyProgram) => {
                if (cm.type === "HospitalSurvey") {
                    return { kind: "MenuLeaf", title: cm.name, path: "hospital-survey" };
                } else if (cm.type === "NationalSurvey") {
                    return { kind: "MenuLeaf", title: cm.name, path: "national-survey" };
                } else {
                    return { kind: "MenuLeaf", title: cm.name, path: "supranational-survey" };
                }
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
        setLoading(true);
        compositionRoot.modules.getAllAccessible
            .execute(userGroups, currentOrgUnitAccess.orgUnitId)
            .run(
                modules => {
                    const parsedMenu = mapModuleToMenu(modules);
                    setMenu(parsedMenu);
                    setLoading(false);
                },
                err => {
                    snackbar.error(i18n.t(err.message));
                    setLoading(false);
                }
            );
    }, [
        compositionRoot.modules.getAllAccessible,
        userGroups,
        currentOrgUnitAccess.orgUnitId,
        snackbar,
    ]);

    return { menu, loading };
}
