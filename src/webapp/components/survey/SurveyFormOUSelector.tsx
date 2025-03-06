import { OrgUnitsSelector } from "@eyeseetea/d2-ui-components";
import { useEffect } from "react";
import { COUNTRY_OU_LEVEL, HOSPITAL_OU_LEVELS } from "../../../data/repositories/UserD2Repository";
import { Id } from "../../../domain/entities/Ref";
import { SURVEYS_WITH_ORG_UNIT_SELECTOR, SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { OrgUnitAccess } from "../../../domain/entities/User";
import { GLOBAL_OU_ID } from "../../../domain/usecases/SaveFormDataUseCase";
import { getParentOUIdFromPath } from "../../../domain/utils/PPSProgramsHelper";
import { useAppContext } from "../../contexts/app-context";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { useSurveyFormOUSelector } from "./hook/useSurveyFormOUSelector";
import { useOfflineSnackbar } from "../../hooks/useOfflineSnackbar";

export interface SurveyFormOUSelectorProps {
    formType: SURVEY_FORM_TYPES;
    currentOrgUnit: OrgUnitAccess | undefined;
    setCurrentOrgUnit: React.Dispatch<React.SetStateAction<OrgUnitAccess | undefined>>;
    currentSurveyId: Id | undefined;
}

export const SurveyFormOUSelector: React.FC<SurveyFormOUSelectorProps> = ({
    formType,
    currentOrgUnit,
    setCurrentOrgUnit,
    currentSurveyId,
}) => {
    const { api } = useAppContext();
    const { currentPPSSurveyForm, currentCountryQuestionnaire, currentPrevalenceSurveyForm } =
        useCurrentSurveys();
    const { onOrgUnitChange, ouSelectorErrMsg, shouldRefresh } = useSurveyFormOUSelector(
        formType,
        setCurrentOrgUnit,
        currentSurveyId
    );
    const { snackbar, offlineError } = useOfflineSnackbar();

    useEffect(() => {
        if (ouSelectorErrMsg) {
            offlineError(ouSelectorErrMsg);
        }
    }, [ouSelectorErrMsg, snackbar, shouldRefresh, offlineError]);

    return (
        <>
            {SURVEYS_WITH_ORG_UNIT_SELECTOR.includes(formType) && (
                <OrgUnitsSelector
                    api={api}
                    fullWidth={false}
                    selected={[currentOrgUnit?.orgUnitPath ? currentOrgUnit?.orgUnitPath : ""]}
                    initiallyExpanded={
                        currentOrgUnit?.orgUnitPath ? [currentOrgUnit?.orgUnitPath] : []
                    }
                    onChange={onOrgUnitChange}
                    singleSelection={true}
                    typeInput={"radio"}
                    hideMemberCount={false}
                    selectableLevels={
                        formType === "PPSCountryQuestionnaire" ||
                        formType === "PrevalenceSurveyForm"
                            ? [COUNTRY_OU_LEVEL]
                            : HOSPITAL_OU_LEVELS
                    }
                    controls={{
                        filterByLevel: false,
                        filterByGroup: false,
                        filterByProgram: false,
                        selectAll: false,
                    }}
                    rootIds={
                        formType === "PPSHospitalForm"
                            ? currentPPSSurveyForm?.surveyType === "HOSP" //For HOSP PPS surveys, show all hospitals across all OUs
                                ? [GLOBAL_OU_ID]
                                : currentCountryQuestionnaire?.orgUnitId
                                ? [currentCountryQuestionnaire?.orgUnitId] //For non-admin user, currentCountryQuestionnaire wont be set. Get parent id from path
                                : [getParentOUIdFromPath(currentOrgUnit?.orgUnitPath)]
                            : formType === "PrevalenceFacilityLevelForm"
                            ? [currentPrevalenceSurveyForm?.orgUnitId]
                            : [GLOBAL_OU_ID]
                    }
                    showShortName={true}
                    showNameSetting={true}
                />
            )}
        </>
    );
};
