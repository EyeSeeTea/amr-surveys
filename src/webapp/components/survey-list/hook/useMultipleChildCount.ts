import { MouseEventHandler, useState } from "react";
import { SortDirection } from "../table/PaginatedSurveyListTable";
import { Survey } from "../../../../domain/entities/Survey";

export const useMultipleChildCount = (
    sortByColumn: (
        columnName: keyof Survey,
        sortDirection: SortDirection,
        childIndex?: number
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
    const [followUpSortDirection, setFollowUpSortDirection] = useState<SortDirection>("asc");
    const [dischargeClinicalSortDirection, setDischargeClinicalSortDirection] =
        useState<SortDirection>("asc");
    const [dischargeEconomicSortDirection, setDischargeEconomicSortDirection] =
        useState<SortDirection>("asc");
    const [cohortEnrolmentSortDirection, setCohortEnrolmentSortDirection] =
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
                return followUpSortDirection;
            case "Discharge - Clinical":
                return dischargeClinicalSortDirection;
            case "Discharge - Economic":
                return dischargeEconomicSortDirection;
            case "Cohort enrolment":
                return cohortEnrolmentSortDirection;

            default:
                throw new Error(`Invalid child option name: ${childOptionName}`);
        }
    };

    const childOnClick = (
        childOptionName: string,
        childIndex: number
    ): MouseEventHandler | undefined => {
        switch (childOptionName) {
            case "Sample Shipment":
                return () => {
                    const nextDir: SortDirection =
                        sampleShipmentsSortDirection === "asc" ? "desc" : "asc";
                    setSampleShipmentsSortDirection(nextDir);
                    sortByColumn("childCount", nextDir, childIndex);
                };
            case "Central Ref Lab Results":
                return () => {
                    const nextDir: SortDirection =
                        centralRefLabsResultsSortDirection === "asc" ? "desc" : "asc";
                    setCentralRefLabsResultsSortDirection(nextDir);
                    sortByColumn("childCount", nextDir, childIndex);
                };
            case "Pathogen Isolates Logs":
                return () => {
                    const nextDir: SortDirection =
                        pathogenIsolatesLogsSortDirection === "asc" ? "desc" : "asc";
                    setPathogenIsolatesLogsSortDirection(nextDir);
                    sortByColumn("childCount", nextDir, childIndex);
                };
            case "Supranational Ref Results":
                return () => {
                    const nextDir: SortDirection =
                        supranationalRefsResultsSortDirection === "asc" ? "desc" : "asc";
                    setSupranationalRefsResultsSortDirection(nextDir);
                    sortByColumn("childCount", nextDir, childIndex);
                };
            case "Follow-up":
                return () => {
                    const nextDir: SortDirection = followUpSortDirection === "asc" ? "desc" : "asc";
                    setFollowUpSortDirection(nextDir);
                    sortByColumn("childCount", nextDir, childIndex);
                };
            case "Discharge - Clinical":
                return () => {
                    const nextDir: SortDirection =
                        dischargeClinicalSortDirection === "asc" ? "desc" : "asc";
                    setDischargeClinicalSortDirection(nextDir);
                    sortByColumn("childCount", nextDir, childIndex);
                };
            case "Discharge - Economic":
                return () => {
                    const nextDir: SortDirection =
                        dischargeEconomicSortDirection === "asc" ? "desc" : "asc";
                    setDischargeEconomicSortDirection(nextDir);
                    sortByColumn("childCount", nextDir, childIndex);
                };
            case "Cohort enrolment":
                return () => {
                    const nextDir: SortDirection =
                        cohortEnrolmentSortDirection === "asc" ? "desc" : "asc";
                    setCohortEnrolmentSortDirection(nextDir);
                    sortByColumn("childCount", nextDir, childIndex);
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
