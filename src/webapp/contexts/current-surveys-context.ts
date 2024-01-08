import { useContext, createContext } from "react";
import { Id, NamedRef } from "../../domain/entities/Ref";
import { OrgUnitNamedRef, SurveyBase } from "../../domain/entities/Survey";

export interface CurrentSurveysContextProps {
    //PPS Module
    currentPPSSurveyForm: SurveyBase | undefined;
    changeCurrentPPSSurveyForm: (survey: SurveyBase | undefined) => void;
    resetCurrentPPSSurveyForm: () => void;

    currentCountryQuestionnaire: OrgUnitNamedRef | undefined;
    changeCurrentCountryQuestionnaire: (id: Id, name: string, orgUnitId: Id) => void;
    resetCurrentCountryQuestionnaire: () => void;

    currentHospitalForm: OrgUnitNamedRef | undefined;
    changeCurrentHospitalForm: (id: Id, name: string, orgUnitId: Id) => void;
    resetCurrentHospitalForm: () => void;

    currentWardRegister: NamedRef | undefined;
    changeCurrentWardRegister: (ward: NamedRef | undefined) => void;
    resetCurrentWardRegister: () => void;

    //Prevalence
    currentPrevalenceSurveyForm: OrgUnitNamedRef | undefined;
    changeCurrentPrevalenceSurveyForm: (id: Id, name: string, orgUnitId: Id) => void;
    resetCurrentPrevalenceSurveyForm: () => void;

    currentFacilityLevelForm: OrgUnitNamedRef | undefined;
    changeCurrentFacilityLevelForm: (id: Id, name: string, orgUnitId: Id) => void;
    resetCurrentFacilityLevelForm: () => void;
}

export const CurrentSurveysContext = createContext<CurrentSurveysContextProps>({
    currentPPSSurveyForm: undefined,
    changeCurrentPPSSurveyForm: () => {},
    resetCurrentPPSSurveyForm: () => {},

    currentCountryQuestionnaire: undefined,
    resetCurrentCountryQuestionnaire: () => {},
    changeCurrentCountryQuestionnaire: () => {},

    currentHospitalForm: undefined,
    changeCurrentHospitalForm: () => {},
    resetCurrentHospitalForm: () => {},

    currentWardRegister: undefined,
    changeCurrentWardRegister: () => {},
    resetCurrentWardRegister: () => {},

    currentPrevalenceSurveyForm: undefined,
    changeCurrentPrevalenceSurveyForm: () => {},
    resetCurrentPrevalenceSurveyForm: () => {},

    currentFacilityLevelForm: undefined,
    changeCurrentFacilityLevelForm: () => {},
    resetCurrentFacilityLevelForm: () => {},
});

export function useCurrentSurveys() {
    const context = useContext(CurrentSurveysContext);
    if (context) {
        return context;
    } else {
        throw new Error("Current surveys context uninitialized");
    }
}
