import useUserAccess from "./useUserAccess";

const useHasAdminAccess = () => {
    const userAccess = useUserAccess();

    return { hasAdminAccess: userAccess.hasAdminAccess };
};

export default useHasAdminAccess;
