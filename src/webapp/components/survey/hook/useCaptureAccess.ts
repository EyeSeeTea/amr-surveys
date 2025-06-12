import useUserAccess from "./useUserAccess";

const useCaptureAccess = () => {
    const userAccess = useUserAccess();

    return { hasCaptureAccess: userAccess.hasCaptureAccess || userAccess.hasAdminAccess };
};

export default useCaptureAccess;
