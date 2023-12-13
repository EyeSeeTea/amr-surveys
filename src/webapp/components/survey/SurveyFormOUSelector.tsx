import { OrgUnitsSelector } from "@eyeseetea/d2-ui-components";
import { COUNTRY_OU_LEVEL, HOSPITAL_OU_LEVEL } from "../../../data/repositories/UserD2Repository";
import { Id } from "../../../domain/entities/Ref";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { OrgUnitAccess } from "../../../domain/entities/User";
import { GLOBAL_OU_ID } from "../../../domain/usecases/SaveFormDataUseCase";
import { getParentOUIdFromPath } from "../../../domain/utils/PPSProgramsHelper";
import { useAppContext } from "../../contexts/app-context";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";

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
    const { currentPPSSurveyForm, currentCountryQuestionnaire } = useCurrentSurveys();
    const { currentUser } = useAppContext();

    const onOrgUnitChange = (orgUnitPaths: string[]) => {
        if (currentSurveyId) {
            alert("Delete the Survey and create new one? Yes/No"); //TO DO : Replace with dialog after behaviour confirmation
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
                    }
                } else if (formType === "PPSHospitalForm") {
                    const currentHospital = currentUser.userHospitalsAccess.find(
                        hospital => hospital.orgUnitId === selectedOU
                    );
                    if (currentHospital) {
                        setCurrentOrgUnit(currentHospital);
                    }
                }
            }
        }
    };

    return (
        <>
            {(formType === "PPSCountryQuestionnaire" ||
                formType === "PPSHospitalForm" ||
                formType === "PrevalenceSurveyForm") && (
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
                            : [HOSPITAL_OU_LEVEL]
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
                            : [GLOBAL_OU_ID]
                    }
                />
            )}
        </>
    );
};
