import { useState, useEffect } from "react";
import useUserAccess from "./useUserAccess";

const useReadOnlyAccess = () => {
    const [hasReadOnlyAccess, setHasReadOnlyAccess] = useState<boolean>(false);

    const userAccess = useUserAccess();

    useEffect(() => {
        setHasReadOnlyAccess(
            userAccess.hasReadAccess && !userAccess.hasCaptureAccess && !userAccess.hasAdminAccess
        );
    }, [userAccess]);

    return { hasReadOnlyAccess };
};

export default useReadOnlyAccess;
