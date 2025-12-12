import { OrgUnitsSelector } from "@eyeseetea/d2-ui-components";
import { useEffect, useMemo } from "react";
import { COUNTRY_OU_LEVEL, HOSPITAL_OU_LEVELS } from "../../../data/repositories/UserD2Repository";
import { Id } from "../../../domain/entities/Ref";
import {
    SURVEYS_WITH_COUNTRY_LEVEL_OU,
    SURVEYS_WITH_ORG_UNIT_SELECTOR,
    SURVEY_FORM_TYPES,
} from "../../../domain/entities/Survey";
import { OrgUnitAccess, UserOrgUnit } from "../../../domain/entities/User";
import { GLOBAL_OU_ID } from "../../../domain/usecases/SaveFormDataUseCase";
import { getParentOUIdFromPath } from "../../../domain/utils/PPSProgramsHelper";
import { useAppContext } from "../../contexts/app-context";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { useSurveyFormOUSelector } from "./hook/useSurveyFormOUSelector";
import { useOfflineSnackbar } from "../../hooks/useOfflineSnackbar";
import _c from "../../../domain/entities/generic/Collection";

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
    const { api, currentUser } = useAppContext();
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

    const rootIds = useMemo(() => {
        if (formType === "PPSHospitalForm") {
            // For HOSP PPS surveys, show all hospitals across all OUs
            if (currentPPSSurveyForm?.surveyType === "HOSP") {
                return [GLOBAL_OU_ID];
            }
            // For non-admin user, currentCountryQuestionnaire won't be set. Get parent id from path
            return currentCountryQuestionnaire?.orgUnitId
                ? [currentCountryQuestionnaire.orgUnitId]
                : [getParentOUIdFromPath(currentOrgUnit?.orgUnitPath)];
        }

        if (formType === "PrevalenceFacilityLevelForm") {
            return [currentPrevalenceSurveyForm?.orgUnitId];
        }

        if (formType === "WardSummaryStatisticsForm") {
            return getRootIds(currentUser.organisationUnits);
        }

        return [GLOBAL_OU_ID];
    }, [
        formType,
        currentPPSSurveyForm?.surveyType,
        currentCountryQuestionnaire?.orgUnitId,
        currentOrgUnit?.orgUnitPath,
        currentPrevalenceSurveyForm?.orgUnitId,
        currentUser.organisationUnits,
    ]);

    const selectableLevels = useMemo(() => {
        if (SURVEYS_WITH_COUNTRY_LEVEL_OU.includes(formType)) return [COUNTRY_OU_LEVEL];
        return HOSPITAL_OU_LEVELS;
    }, [formType]);

    const selected = useMemo(
        () => (currentOrgUnit?.orgUnitPath ? [currentOrgUnit.orgUnitPath] : []),
        [currentOrgUnit?.orgUnitPath]
    );

    return (
        <>
            {SURVEYS_WITH_ORG_UNIT_SELECTOR.includes(formType) && (
                <OrgUnitsSelector
                    api={api}
                    fullWidth={false}
                    selected={selected}
                    initiallyExpanded={
                        currentOrgUnit?.orgUnitPath ? [currentOrgUnit?.orgUnitPath] : []
                    }
                    onChange={onOrgUnitChange}
                    singleSelection={true}
                    typeInput={"radio"}
                    hideMemberCount={false}
                    selectableLevels={selectableLevels}
                    controls={{
                        filterByLevel: false,
                        filterByGroup: false,
                        filterByProgram: false,
                        selectAll: false,
                    }}
                    rootIds={rootIds}
                    showShortName={true}
                    showNameSetting={true}
                />
            )}
        </>
    );
};

function getRoots(orgUnits: UserOrgUnit[]): UserOrgUnit[] {
    const minLevel = Math.min(...orgUnits.map(ou => ou.level));
    return _c(orgUnits)
        .filter(ou => ou.level === minLevel)
        .sortBy(ou => ou.name)
        .value();
}

export function getRootIds(orgUnits: UserOrgUnit[]): Id[] {
    return getRoots(orgUnits).map(ou => ou.id);
}
