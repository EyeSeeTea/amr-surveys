import { useContext, createContext } from "react";
import { Id, NamedRef } from "../../domain/entities/Ref";
import { OrgUnitNamedRef, PrevalenceSurveyForm, SurveyBase } from "../../domain/entities/Survey";
import { ASTGUIDELINE_TYPES } from "../../domain/entities/ASTGuidelines";

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
    currentPrevalenceSurveyForm: PrevalenceSurveyForm | undefined;
    changeCurrentPrevalenceSurveyForm: (
        id: Id,
        name: string,
        orgUnitId: Id,
        astGuidelines: ASTGUIDELINE_TYPES | undefined
    ) => void;
    resetCurrentPrevalenceSurveyForm: () => void;

    currentFacilityLevelForm: OrgUnitNamedRef | undefined;
    changeCurrentFacilityLevelForm: (id: Id, name: string, orgUnitId: Id) => void;
    resetCurrentFacilityLevelForm: () => void;

    currentCaseReportForm: NamedRef | undefined;
    changeCurrentCaseReportForm: (caseReport: NamedRef | undefined) => void;
    resetCurrentCaseReportForm: () => void;
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

    currentCaseReportForm: undefined,
    changeCurrentCaseReportForm: () => {},
    resetCurrentCaseReportForm: () => {},
});

export function useCurrentSurveys() {
    const context = useContext(CurrentSurveysContext);
    if (context) {
        return context;
    } else {
        throw new Error("Current surveys context uninitialized");
    }
}
