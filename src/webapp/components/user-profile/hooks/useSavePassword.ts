import { useAppContext } from "../../../contexts/app-context";
import { useState } from "react";
import { SaveState } from "../../survey/hook/useSaveSurvey";

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
                    message: "User password changed successfully.",
                });
                setPassword("");
                setConfirmPassword("");
                // setIsLoading(false);
            },
            error => {
                setSavePasswordStatus({
                    status: "error",
                    message: error.message,
                });
                // setIsLoading(false);
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
