import { useAppContext } from "../../../contexts/app-context";
import { useState } from "react";
import { SaveState } from "../../survey/hook/useSaveSurvey";
import i18n from "@eyeseetea/feedback-component/locales";

export function useSavePassword() {
    const { compositionRoot } = useAppContext();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [savePasswordStatus, setSavePasswordStatus] = useState<SaveState>();

    const savePassword = (password: string) => {
        compositionRoot.users.savePassword.execute(password).run(
            () => {
                setSavePasswordStatus({
                    status: "success",
                    message: i18n.t("User password changed successfully."),
                });
                setPassword("");
                setConfirmPassword("");
            },
            error => {
                setSavePasswordStatus({
                    status: "error",
                    message: i18n.t(error.message),
                });
            }
        );
    };

    return {
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        savePasswordStatus,
        savePassword,
    };
}