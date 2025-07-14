import { PREVALENCE_MORTALITY_DISCHARGE_ECONOMIC_FORM } from "../../data/entities/D2Survey";
import { AMRSurveyModule } from "../entities/AMRSurveyModule";

export type OptionType = {
    label: string;
    isHidden?: boolean;
    isSubMenu?: boolean;
    subMenu?: OptionType[];
};

export const DefaultFormOptions = (hasReadAccess: boolean, hasCaptureAccess: boolean) => {
    return [
        {
            label: "Edit",
            isHidden: hasReadAccess,
        },
        {
            label: "View",
            isHidden: hasCaptureAccess,
        },
        {
            label: "Delete",
            isHidden: hasReadAccess,
        },
    ];
};

export const PPSSurveyNationalOptions = (hasReadAccess: boolean, hasCaptureAccess: boolean) => {
    return [
        ...DefaultFormOptions(hasReadAccess, hasCaptureAccess),
        {
            label: "New Country",
            isHidden: hasReadAccess,
        },
        {
            label: "List Country",
        },
    ];
};

export const PPSSurveyHospitalOptions = (hasReadAccess: boolean, hasCaptureAccess: boolean) => {
    return [
        ...DefaultFormOptions(hasReadAccess, hasCaptureAccess),
        {
            label: "New Hospital",
            isHidden: hasReadAccess,
        },
        {
            label: "List Hospitals",
        },
    ];
};

export const PPSSurveyDefaultOptions = (hasReadAccess: boolean, hasCaptureAccess: boolean) => {
    return [
        ...DefaultFormOptions(hasReadAccess, hasCaptureAccess),
        {
            label: "New Country",
            isHidden: hasReadAccess,
        },
        {
            label: "List Countries",
        },
    ];
};

export const PPSCountryFormOptions = (hasReadAccess: boolean, hasCaptureAccess: boolean) => {
    return [
        {
            label: "New Hospital",
            isHidden: hasReadAccess,
        },
        {
            label: "List Hospitals",
        },
        ...DefaultFormOptions(hasReadAccess, hasCaptureAccess),
    ];
};

export const PPSHospitalFormOptions = (hasReadAccess: boolean, hasCaptureAccess: boolean) => {
    return [
        ...DefaultFormOptions(hasReadAccess, hasCaptureAccess),
        {
            label: "New Ward",
            isHidden: hasReadAccess,
        },
        {
            label: "List Wards",
        },
    ];
};

export const PPSWardFormOptions = (hasReadAccess: boolean, hasCaptureAccess: boolean) => {
    return [
        ...DefaultFormOptions(hasReadAccess, hasCaptureAccess),
        {
            label: "New Patient",
            isHidden: hasReadAccess,
        },
        {
            label: "List Patients",
        },
    ];
};

export const PrevalenceSurveyFormOptions = (hasReadAccess: boolean, hasCaptureAccess: boolean) => {
    return [
        ...DefaultFormOptions(hasReadAccess, hasCaptureAccess),
        {
            label: "New Facility",
            isHidden: hasReadAccess,
        },
        {
            label: "List Facilities",
        },
    ];
};

export const PrevalenceFacilityLevelFormOptions = (
    hasReadAccess: boolean,
    hasCaptureAccess: boolean
) => {
    return [
        ...DefaultFormOptions(hasReadAccess, hasCaptureAccess),
        {
            label: "New Patient",
            isHidden: hasReadAccess,
        },
        {
            label: "List Patients",
        },
    ];
};

export const PrevalenceCaseReportFormOptions = (
    parentSurveyId: string,
    currentModule: AMRSurveyModule | undefined,
    hasReadAccess: boolean,
    hasCaptureAccess: boolean
) => {
    const disabledForms = getDisabledForms(currentModule, parentSurveyId);

    return [
        ...DefaultFormOptions(hasReadAccess, hasCaptureAccess),
        {
            label: "Shipments and Lab results",
            isSubMenu: true,
            subMenu: [
                {
                    label: "New Sample Shipment",
                    isHidden: hasReadAccess,
                },
                {
                    label: "List Sample Shipments",
                },
                {
                    label: "New Central Ref Lab Results",
                    isHidden: hasReadAccess,
                },
                {
                    label: "List Central Ref Labs Results",
                },
                {
                    label: "New Pathogen Isolates Log",
                    isHidden: hasReadAccess,
                },
                {
                    label: "List Pathogen Isolates Logs",
                },
                {
                    label: "New Supranational Ref Results",
                    isHidden: hasReadAccess,
                },
                {
                    label: "List Supranational Refs Results",
                },
            ],
        },
        {
            label: "Mortality",
            isSubMenu: true,
            subMenu: [
                {
                    label: "New D28 Follow-up",
                    isHidden: hasReadAccess,
                },
                {
                    label: "List D28 Follow-up",
                },
                {
                    label: "New Discharge - Clinical",
                    isHidden: hasReadAccess,
                },
                {
                    label: "List Discharge - Clinical",
                },
                {
                    label: "New Discharge - Economic",
                    isHidden:
                        hasReadAccess ||
                        disabledForms.includes(PREVALENCE_MORTALITY_DISCHARGE_ECONOMIC_FORM),
                },
                {
                    label: "List Discharge - Economic",
                    isHidden: disabledForms.includes(PREVALENCE_MORTALITY_DISCHARGE_ECONOMIC_FORM),
                },
                {
                    label: "New Cohort enrolment",
                    isHidden: hasReadAccess,
                },
                {
                    label: "List Cohort enrolment",
                },
            ],
        },
    ];
};

export function getDisabledForms(
    currentModule: AMRSurveyModule | undefined,
    parentSurveyId: string
) {
    const customFormsBySurvey = currentModule?.customForms?.[parentSurveyId];

    const disabledForms = customFormsBySurvey
        ? Object.entries(customFormsBySurvey)
              .filter(([_, value]) => !value || value === "")
              .map(([key]) => key)
        : [];

    return disabledForms;
}
