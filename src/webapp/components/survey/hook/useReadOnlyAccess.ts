import { useState, useEffect } from "react";
import { useAppContext } from "../../../contexts/app-context";
import { useCurrentModule } from "../../../contexts/current-module-context";
import { getUserAccess } from "../../../../domain/utils/menuHelper";

const useReadOnlyAccess = () => {
    const { currentUser } = useAppContext();
    const { currentModule } = useCurrentModule();
    const [hasReadOnlyAccess, setHasReadOnlyAccess] = useState<boolean>(false);

    useEffect(() => {
        if (currentModule) {
            const { hasReadAccess, hasCaptureAccess, hasAdminAccess } = getUserAccess(
                currentModule,
                currentUser.userGroups
            );
            setHasReadOnlyAccess(hasReadAccess && !hasCaptureAccess && !hasAdminAccess);
        }
    }, [currentModule, currentUser.userGroups]);

    return { hasReadOnlyAccess };
};

export default useReadOnlyAccess;
