import { MouseEventHandler, useState } from "react";

import { Survey } from "../../../../domain/entities/Survey";
import { SortDirection } from "./useSurveyListActions";

export const useMultipleChildCount = (
    sortByColumn: (columnName: keyof Survey, sortDirection: SortDirection) => void
) => {
    const [sampleShipmentsSortDirection, setSampleShipmentsSortDirection] =
        useState<SortDirection>("asc");
    const [centralRefLabsResultsSortDirection, setCentralRefLabsResultsSortDirection] =
        useState<SortDirection>("asc");
    const [pathogenIsolatesLogsSortDirection, setPathogenIsolatesLogsSortDirection] =
        useState<SortDirection>("asc");
    const [supranationalRefsResultsSortDirection, setSupranationalRefsResultsSortDirection] =
        useState<SortDirection>("asc");
    const [childrenSortDirection, setChildrenSortDirection] = useState<SortDirection>("asc");

    const getCurrentSortDirection = (childOptionName: string): SortDirection => {
        switch (childOptionName) {
            case "Sample Shipment":
                return sampleShipmentsSortDirection;
            case "Central Ref Lab Results":
                return centralRefLabsResultsSortDirection;
            case "Pathogen Isolates Logs":
                return pathogenIsolatesLogsSortDirection;
            case "Supranational Ref Results":
                return supranationalRefsResultsSortDirection;
            case "D28 Follow-up":
            case "Discharge":
            case "Cohort enrolment":
                return "asc";

            default:
                return childrenSortDirection;
        }
    };

    const childOnClick = (childOptionName: string): MouseEventHandler | undefined => {
        switch (childOptionName) {
            case "Sample Shipment":
                return () => {
                    sampleShipmentsSortDirection === "asc"
                        ? setSampleShipmentsSortDirection("desc")
                        : setSampleShipmentsSortDirection("asc");
                    sortByColumn("childCount", sampleShipmentsSortDirection);
                };
            case "Central Ref Lab Results":
                return () => {
                    centralRefLabsResultsSortDirection === "asc"
                        ? setCentralRefLabsResultsSortDirection("desc")
                        : setCentralRefLabsResultsSortDirection("asc");
                    sortByColumn("childCount", centralRefLabsResultsSortDirection);
                };
            case "Pathogen Isolates Logs":
                return () => {
                    pathogenIsolatesLogsSortDirection === "asc"
                        ? setPathogenIsolatesLogsSortDirection("desc")
                        : setPathogenIsolatesLogsSortDirection("asc");
                    sortByColumn("childCount", pathogenIsolatesLogsSortDirection);
                };
            case "Supranational Ref Results":
                return () => {
                    supranationalRefsResultsSortDirection === "asc"
                        ? setSupranationalRefsResultsSortDirection("desc")
                        : setSupranationalRefsResultsSortDirection("asc");
                    sortByColumn("childCount", supranationalRefsResultsSortDirection);
                };
            default:
                return () => {
                    childrenSortDirection === "asc"
                        ? setChildrenSortDirection("desc")
                        : setChildrenSortDirection("asc");
                    sortByColumn("childCount", childrenSortDirection);
                };
        }
    };

    return {
        getCurrentSortDirection,
        childOnClick,
    };
};
