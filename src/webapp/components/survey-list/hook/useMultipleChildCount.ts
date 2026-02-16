import { MouseEventHandler, useState } from "react";
import { SortDirection } from "../table/PaginatedSurveyListTable";
import { Survey } from "../../../../domain/entities/Survey";

export const useMultipleChildCount = (
    sortByColumn: (
        columnName: keyof Survey,
        sortDirection: SortDirection,
        childLabel?: string
    ) => void
) => {
    const [sampleShipmentsSortDirection, setSampleShipmentsSortDirection] =
        useState<SortDirection>("asc");
    const [centralRefLabsResultsSortDirection, setCentralRefLabsResultsSortDirection] =
        useState<SortDirection>("asc");
    const [pathogenIsolatesLogsSortDirection, setPathogenIsolatesLogsSortDirection] =
        useState<SortDirection>("asc");
    const [supranationalRefsResultsSortDirection, setSupranationalRefsResultsSortDirection] =
        useState<SortDirection>("asc");

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
            case "Follow-up":
            case "Discharge - Clinical":
            case "Discharge - Economic":
            case "Cohort enrolment":
                return "asc";

            default:
                throw new Error(`Invalid child option name: ${childOptionName}`);
        }
    };

    const childOnClick = (childOptionName: string): MouseEventHandler | undefined => {
        switch (childOptionName) {
            case "Sample Shipment":
                return () => {
                    const nextDir: SortDirection =
                        sampleShipmentsSortDirection === "asc" ? "desc" : "asc";
                    setSampleShipmentsSortDirection(nextDir);
                    sortByColumn("childCount", nextDir, "Sample Shipment");
                };
            case "Central Ref Lab Results":
                return () => {
                    const nextDir: SortDirection =
                        centralRefLabsResultsSortDirection === "asc" ? "desc" : "asc";
                    setCentralRefLabsResultsSortDirection(nextDir);
                    sortByColumn("childCount", nextDir, "Central Ref Lab Results");
                };
            case "Pathogen Isolates Logs":
                return () => {
                    const nextDir: SortDirection =
                        pathogenIsolatesLogsSortDirection === "asc" ? "desc" : "asc";
                    setPathogenIsolatesLogsSortDirection(nextDir);
                    sortByColumn("childCount", nextDir, "Pathogen Isolates Logs");
                };
            case "Supranational Ref Results":
                return () => {
                    const nextDir: SortDirection =
                        supranationalRefsResultsSortDirection === "asc" ? "desc" : "asc";
                    setSupranationalRefsResultsSortDirection(nextDir);
                    sortByColumn("childCount", nextDir, "Supranational Ref Results");
                };
            default:
                return undefined;
        }
    };

    return {
        getCurrentSortDirection,
        childOnClick,
    };
};
