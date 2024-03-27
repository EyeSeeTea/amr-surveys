import { useState, useEffect } from "react";
import { useAppContext } from "../../../contexts/app-context";
import { useCurrentModule } from "../../../contexts/current-module-context";
import { getUserAccess } from "../../../../domain/utils/menuHelper";

const useReadAccess = () => {
    const { currentUser } = useAppContext();
    const { currentModule } = useCurrentModule();
    const [hasReadAccess, setHasReadAccess] = useState<boolean>(false);

    useEffect(() => {
        if (currentModule) {
            const { hasReadAccess, hasCaptureAccess, hasAdminAccess } = getUserAccess(
                currentModule,
                currentUser.userGroups
            );
            setHasReadAccess(hasReadAccess && !hasCaptureAccess && !hasAdminAccess);
        }
    }, [currentModule, currentUser.userGroups]);

    return { hasReadAccess };
};

export default useReadAccess;
