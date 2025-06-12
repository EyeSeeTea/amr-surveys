import { useState, useEffect } from "react";
import { useAppContext } from "../../../contexts/app-context";
import { useCurrentModule } from "../../../contexts/current-module-context";
import { getUserAccess, UserAccess } from "../../../../domain/utils/menuHelper";

const useUserAccess = () => {
    const { currentUser } = useAppContext();
    const { currentModule } = useCurrentModule();
    const [userAccess, setUserAccess] = useState<UserAccess>({
        hasAdminAccess: false,
        hasCaptureAccess: false,
        hasReadAccess: false,
    });

    useEffect(() => {
        if (currentModule) {
            const userAccess = getUserAccess(currentModule, currentUser.userGroups);

            setUserAccess(userAccess);
        }
    }, [currentModule, currentUser]);

    return userAccess;
};

export default useUserAccess;
