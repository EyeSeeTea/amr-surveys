import { useState, useEffect } from "react";
import { useAppContext } from "../../../contexts/app-context";
import { useCurrentModule } from "../../../contexts/current-module-context";
import { getUserAccess } from "../../../../domain/utils/menuHelper";

const useHasAdminAccess = () => {
    const { currentUser } = useAppContext();
    const { currentModule } = useCurrentModule();
    const [hasAdminAccess, setHasAdminAccess] = useState<boolean>(false);

    useEffect(() => {
        if (currentModule) {
            const { hasAdminAccess } = getUserAccess(currentModule, currentUser.userGroups);

            setHasAdminAccess(hasAdminAccess);
        }
    }, [currentModule, currentUser]);

    return { hasAdminAccess };
};

export default useHasAdminAccess;
