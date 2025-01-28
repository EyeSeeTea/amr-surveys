import { useCallback } from "react";
import i18n from "../../utils/i18n";
import useOnlineStatus from "./useOnlineStatus";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import { Message, SnackbarOptions } from "@eyeseetea/d2-ui-components/snackbar/types";

export function useOfflineSnackbar() {
    const isOnline = useOnlineStatus();
    const snackbar = useSnackbar();

    const offlineError = useCallback(
        (message: Message, options?: Partial<SnackbarOptions>) => {
            if (!isOnline) {
                return snackbar.error(
                    i18n.t(
                        "You cannot carry out this action because you are not connected to the internet. Please try again later."
                    ),
                    options
                );
            } else {
                return snackbar.error(message, options);
            }
        },
        [isOnline, snackbar]
    );

    return { snackbar: snackbar, offlineError: offlineError };
}
