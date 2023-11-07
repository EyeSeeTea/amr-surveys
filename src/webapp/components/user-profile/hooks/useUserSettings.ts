import { useAppContext } from "../../../contexts/app-context";
import { SetStateAction, useEffect, useState } from "react";
import { LocalesType } from "../../../../domain/usecases/GetDatabaseLocalesUseCase";
import { SaveState } from "../../survey/hook/useSaveSurvey";

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
                    message: "Error fetching Database locales",
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
                    message: "Error fetching UI locales",
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
                          message: "Interface language updated successfully",
                      });
                  },
                  () => {
                      setSaveLocaleStatus({
                          status: "error",
                          message: "Error updating interface language.",
                      });
                  }
              )
            : compositionRoot.users.saveKeyDbLocale.execute(value).run(
                  () => {
                      setSaveLocaleStatus({
                          status: "success",
                          message: "Database language updated successfully",
                      });
                  },
                  () => {
                      setSaveLocaleStatus({
                          status: "error",
                          message: "Error updating database language.",
                      });
                  }
              );
    };

    return { databaseLocalesOptions, uiLocalesOptions, saveLocaleStatus, changeLocale };
}
