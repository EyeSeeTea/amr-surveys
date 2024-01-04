import { useState } from "react";
import { Id } from "../../../../domain/entities/Ref";
import { SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import { OrgUnitAccess } from "../../../../domain/entities/User";
import { useAppContext } from "../../../contexts/app-context";
import { useHospitalContext } from "../../../contexts/hospital-context";

export function useSurveyFormOUSelector(
    formType: SURVEY_FORM_TYPES,
    setCurrentOrgUnit: React.Dispatch<React.SetStateAction<OrgUnitAccess | undefined>>,
    currentSurveyId: Id | undefined
) {
    const [ouSelectorErrMsg, setOUSelectorErrMsg] = useState<string>();
    const [shouldRefresh, setShouldRefresh] = useState({});
    const { currentUser } = useAppContext();
    const { userHospitalsAccess } = useHospitalContext();

    const onOrgUnitChange = (orgUnitPaths: string[]) => {
        if (currentSurveyId) {
            setOUSelectorErrMsg(
                "Cannot change the assigned country/hospital. Please delete the survey and create a new one."
            );
            setShouldRefresh({});
            return;
        }

        if (orgUnitPaths[0]) {
            const orgUnits = orgUnitPaths[0].split("/");

            const selectedOU = orgUnits[orgUnits.length - 1];
            if (selectedOU) {
                if (formType === "PPSCountryQuestionnaire" || formType === "PrevalenceSurveyForm") {
                    const currentCountry = currentUser.userCountriesAccess.find(
                        ou => ou.orgUnitId === selectedOU
                    );
                    if (currentCountry) {
                        setCurrentOrgUnit(currentCountry);
                    } else {
                        setOUSelectorErrMsg(`You do not have access to this country.`);
                        setShouldRefresh({});
                    }
                } else if (
                    formType === "PPSHospitalForm" ||
                    formType === "PrevalenceFacilityLevelForm"
                ) {
                    const currentHospital = userHospitalsAccess.find(
                        hospital => hospital.orgUnitId === selectedOU
                    );
                    if (currentHospital) {
                        setCurrentOrgUnit(currentHospital);
                    } else {
                        setOUSelectorErrMsg("You do not have access to this hospital.");
                        setShouldRefresh({});
                    }
                }
            }
        }
    };

    return { onOrgUnitChange, ouSelectorErrMsg, shouldRefresh };
}
