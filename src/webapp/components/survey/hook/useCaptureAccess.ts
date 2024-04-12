import { useState, useEffect } from "react";
import { useAppContext } from "../../../contexts/app-context";
import { useCurrentModule } from "../../../contexts/current-module-context";
import { getUserAccess } from "../../../../domain/utils/menuHelper";

const useCaptureAccess = () => {
    const { currentUser } = useAppContext();
    const { currentModule } = useCurrentModule();
    const [hasCaptureAccess, setHasCaptureAccess] = useState<boolean>(false);

    useEffect(() => {
        if (currentModule) {
            const { hasCaptureAccess, hasAdminAccess } = getUserAccess(
                currentModule,
                currentUser.userGroups
            );

            setHasCaptureAccess(hasCaptureAccess || hasAdminAccess);
        }
    }, [currentModule, currentUser]);

    return { hasCaptureAccess };
};

export default useCaptureAccess;
