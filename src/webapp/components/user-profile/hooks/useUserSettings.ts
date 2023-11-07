import { useAppContext } from "../../../contexts/app-context";
import { SetStateAction, useEffect, useState } from "react";
import { LocalesType } from "../../../../domain/usecases/GetDatabaseLocalesUseCase";
import { SaveState } from "../../survey/hook/useSaveSurvey";
import i18n from "@eyeseetea/feedback-component/locales";

export function useUserSettings() {
    const { compositionRoot } = useAppContext();
    const [databaseLocalesOptions, setDatabaseLocalesOptions] = useState<LocalesType>([]);
    const [uiLocalesOptions, setUiLocalesOptions] = useState<LocalesType>([]);

    const [saveLocaleStatus, setSaveLocaleStatus] = useState<SaveState>();

    useEffect(() => {
        compositionRoot.locales.getDatabaseLocales.execute().run(
            (locales: SetStateAction<LocalesType>) => {
                setDatabaseLocalesOptions(locales);
            },
            () => {
                setSaveLocaleStatus({
                    status: "error",
                    message: i18n.t("Error fetching Database locales"),
                });
            }
        );
        compositionRoot.locales.getUiLocales.execute().run(
            locales => {
                setUiLocalesOptions(locales);
            },
            () => {
                setSaveLocaleStatus({
                    status: "error",
                    message: i18n.t("Error fetching UI locales"),
                });
            }
        );
    }, [compositionRoot.locales.getUiLocales, compositionRoot.locales.getDatabaseLocales]);

    const changeLocale = (isUiLocale: boolean, value: string) => {
        isUiLocale
            ? compositionRoot.users.saveKeyUiLocale.execute(value).run(
                  () => {
                      setSaveLocaleStatus({
                          status: "success",
                          message: i18n.t("Interface language updated successfully"),
                      });
                  },
                  () => {
                      setSaveLocaleStatus({
                          status: "error",
                          message: i18n.t("Error updating interface language."),
                      });
                  }
              )
            : compositionRoot.users.saveKeyDbLocale.execute(value).run(
                  () => {
                      setSaveLocaleStatus({
                          status: "success",
                          message: i18n.t("Database language updated successfully"),
                      });
                  },
                  () => {
                      setSaveLocaleStatus({
                          status: "error",
                          message: i18n.t("Error updating database language."),
                      });
                  }
              );
    };

    return { databaseLocalesOptions, uiLocalesOptions, saveLocaleStatus, changeLocale };
}
