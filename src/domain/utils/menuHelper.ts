import { AMRSurveyModule } from "../entities/AMRSurveyModule";
import { NamedRef } from "../entities/Ref";
import { SURVEY_FORM_TYPES } from "../entities/Survey";

export type UserAccess = {
    hasReadAccess: boolean;
    hasCaptureAccess: boolean;
    hasAdminAccess: boolean;
};

export const getUserAccess = (
    module: AMRSurveyModule,
    currentUserGroups: NamedRef[]
): UserAccess => {
    const hasReadAccess =
        currentUserGroups.filter(cug =>
            module.userGroups.readAccess?.some(raug => raug.id === cug.id)
        ).length > 0;
    const hasCaptureAccess =
        currentUserGroups.filter(cug =>
            module.userGroups.captureAccess?.some(caug => caug.id === cug.id)
        ).length > 0;
    const hasAdminAccess =
        currentUserGroups.filter(cug =>
            module.userGroups.adminAccess?.some(aaug => aaug.id === cug.id)
        ).length > 0;
    return { hasReadAccess, hasCaptureAccess, hasAdminAccess };
};

// returns the survey form  type to be displayed
// on surveys menu click based on module and user type
export const getBaseSurveyFormType = (
    module: AMRSurveyModule,
    currentUserGroups: NamedRef[]
): SURVEY_FORM_TYPES => {
    switch (module.name) {
        case "PPS": {
            const { hasReadAccess, hasCaptureAccess, hasAdminAccess } = getUserAccess(
                module,
                currentUserGroups
            );
            if (hasAdminAccess) return "PPSSurveyForm";
            else if (hasReadAccess || hasCaptureAccess) return "PPSHospitalForm";
            else
                throw new Error(
                    "You dont have the neccessary permissions. Please contact your system administrator."
                );
        }
        case "Prevalence": {
            const { hasReadAccess, hasCaptureAccess, hasAdminAccess } = getUserAccess(
                module,
                currentUserGroups
            );
            if (hasAdminAccess) return "PrevalenceSurveyForm";
            else if (hasReadAccess || hasCaptureAccess) return "PrevalenceFacilityLevelForm";
            else
                throw new Error(
                    "You dont have the neccessary permissions. Please contact your system administrator."
                );
        }
        default:
            throw new Error("Unknown Module type");
    }
};
