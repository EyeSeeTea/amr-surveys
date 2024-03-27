export type OptionType = {
    label: string;
    isHidden?: boolean;
};

export const PPSSurveyNationalOptions = (hasReadAccess: boolean, hasCaptureAccess: boolean) => {
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
            label: "Add New Country",
        },
        {
            label: "List Country",
        },
        {
            label: "Delete",
            isHidden: hasReadAccess,
        },
    ];
};

export const PPSSurveyHospitalOptions = (hasReadAccess: boolean, hasCaptureAccess: boolean) => {
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
            label: "Add New Hospital",
        },
        {
            label: "List Hospitals",
        },
        {
            label: "Delete",
            isHidden: hasReadAccess,
        },
    ];
};

export const PPSSurveyDefaultOptions = (hasReadAccess: boolean, hasCaptureAccess: boolean) => {
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
            label: "Add New Country",
        },
        {
            label: "List Countries",
        },
        {
            label: "Delete",
            isHidden: hasReadAccess,
        },
    ];
};

export const PPSCountryFormOptions = (hasReadAccess: boolean, hasCaptureAccess: boolean) => {
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
            label: "Add New Hospital",
        },
        {
            label: "List Hospitals",
        },
        {
            label: "Delete",
            isHidden: hasReadAccess,
        },
    ];
};

export const PPSHospitalFormOptions = (hasReadAccess: boolean, hasCaptureAccess: boolean) => {
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
            label: "Add New Ward",
        },
        {
            label: "List Wards",
        },
        {
            label: "Delete",
            isHidden: hasReadAccess,
        },
    ];
};

export const PPSWardFormOptions = (hasReadAccess: boolean, hasCaptureAccess: boolean) => {
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
            label: "Add New Patient",
        },
        {
            label: "List Patients",
        },
        {
            label: "Delete",
            isHidden: hasReadAccess,
        },
    ];
};

export const PrevalenceSurveyFormOptions = (hasReadAccess: boolean, hasCaptureAccess: boolean) => {
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
            label: "Add New Facility",
        },
        {
            label: "List Facilities",
        },
        {
            label: "Delete",
            isHidden: hasReadAccess,
        },
    ];
};

export const PrevalenceFacilityLevelFormOptions = (
    hasReadAccess: boolean,
    hasCaptureAccess: boolean
) => {
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
            label: "Add New Patient",
        },
        {
            label: "List Patients",
        },
        {
            label: "Delete",
            isHidden: hasReadAccess,
        },
    ];
};

export const PrevalenceCaseReportFormOptions = (
    hasReadAccess: boolean,
    hasCaptureAccess: boolean
) => {
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
            label: "Add New Sample Shipment",
            isHidden: hasReadAccess,
        },
        {
            label: "List Sample Shipments",
        },
        {
            label: "Add New Central Ref Lab",
            isHidden: hasReadAccess,
        },
        {
            label: "List Central Ref Labs",
        },
        {
            label: "Add New Pathogen Isolates Log",
            isHidden: hasReadAccess,
        },
        {
            label: "List Pathogen Isolates Logs",
        },
        {
            label: "Add New Supranational Ref",
            isHidden: hasReadAccess,
        },
        {
            label: "List Supranational Refs",
        },
        {
            label: "Delete",
            isHidden: hasReadAccess,
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
