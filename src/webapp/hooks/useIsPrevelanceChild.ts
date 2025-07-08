import { useCallback } from "react";
import { SURVEY_FORM_TYPES } from "../../domain/entities/Survey";

export function useIsPrevelanceChild(formType: SURVEY_FORM_TYPES) {
    const isPrevelanceChild = useCallback(() => {
        return (
            formType === "PrevalenceFacilityLevelForm" ||
            formType === "PrevalenceCaseReportForm" ||
            formType === "PrevalenceCentralRefLabForm" ||
            formType === "PrevalencePathogenIsolatesLog" ||
            formType === "PrevalenceSampleShipTrackForm" ||
            formType === "PrevalenceSupranationalRefLabForm" ||
            formType === "PrevalenceDischargeClinical" ||
            formType === "PrevalenceDischargeEconomic" ||
            formType === "PrevalenceD28FollowUp" ||
            formType === "PrevalenceCohortEnrolment"
        );
    }, [formType]);

    return { isPrevelanceChild };
}
