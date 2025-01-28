import { useCallback } from "react";
import useOnlineStatus from "./useOnlineStatus";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import { Message, SnackbarOptions } from "@eyeseetea/d2-ui-components/snackbar/types";
import { OfflineMessage } from "../components/offline-message/OfflineMessage";

export function useOfflineSnackbar() {
    const isOnline = useOnlineStatus();
    const snackbar = useSnackbar();

    const offlineError = useCallback(
        (message: Message, options?: Partial<SnackbarOptions>) => {
            if (!isOnline) {
                return snackbar.error(<OfflineMessage />, options);
            } else {
                return snackbar.error(message, options);
            }
        },
        [isOnline, snackbar]
    );

    return { snackbar: snackbar, offlineError: offlineError };
}
