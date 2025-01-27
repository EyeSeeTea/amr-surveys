import { useCallback } from "react";
import i18n from "../../utils/i18n";
import useOnlineStatus from "./useOnlineStatus";
import { SnackbarState, useSnackbar } from "@eyeseetea/d2-ui-components";
import { Message, SnackbarOptions } from "@eyeseetea/d2-ui-components/snackbar/types";

export interface OfflineErrorNotifier {
    onOfflineError: (error: string) => void;
}

export function useOfflineSnackbar(): SnackbarState {
    const isOnline = useOnlineStatus();
    const snackbar = useSnackbar();

    const offlineError = useCallback(
        () => (message: Message, options?: Partial<SnackbarOptions>) => {
            if (!isOnline) {
                return snackbar.error(
                    i18n.t("You are offline. Please check your internet connection."),
                    options
                );
            } else {
                return snackbar.error(message, options);
            }
        },
        [isOnline, snackbar]
    );

    return {
        ...snackbar,
        error: offlineError,
    };
}
