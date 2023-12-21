import { getAllOrgUnitsByLevel } from "../data/utils/getAllOrgUnitsByLevel";

// eslint-disable-next-line no-restricted-globals
self.onmessage = (e: MessageEvent<string>) => {
    if (e.data === "getOrgUnit") {
        const orgUnits = getAllOrgUnitsByLevel(api);
        // eslint-disable-next-line no-restricted-globals
        self.postMessage(orgUnits);
    }
};

export {};
