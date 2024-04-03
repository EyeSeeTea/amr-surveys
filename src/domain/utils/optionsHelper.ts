export type OptionType = {
    label: string;
    isHidden?: boolean;
};

export const PPSSurveyNationalOptions = (hasReadAccess: boolean, hasCaptureAccess: boolean) => {
    return [
        ...DefaultFormOptions(hasReadAccess, hasCaptureAccess),
        {
            label: "Add New Country",
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
            label: "Add New Hospital",
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
            label: "Add New Country",
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
            label: "Add New Hospital",
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
            label: "Add New Ward",
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
            label: "Add New Patient",
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
            label: "Add New Facility",
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
            label: "Add New Patient",
            isHidden: hasReadAccess,
        },
        {
            label: "List Patients",
        },
    ];
};

export const PrevalenceCaseReportFormOptions = (
    hasReadAccess: boolean,
    hasCaptureAccess: boolean
) => {
    return [
        ...DefaultFormOptions(hasReadAccess, hasCaptureAccess),
        {
            label: "Add New Sample Shipment",
            isHidden: hasReadAccess,
        },
        {
            label: "List Sample Shipments",
        },
        {
            label: "Add New Central Ref Lab Results",
            isHidden: hasReadAccess,
        },
        {
            label: "List Central Ref Labs Results",
        },
        {
            label: "Add New Pathogen Isolates Log",
            isHidden: hasReadAccess,
        },
        {
            label: "List Pathogen Isolates Logs",
        },
        {
            label: "Add New Supranational Ref Results",
            isHidden: hasReadAccess,
        },
        {
            label: "List Supranational Refs Results",
        },
    ];
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
