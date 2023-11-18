import { useContext, createContext } from "react";
import { Id } from "../../domain/entities/Ref";

export interface CurrentSurveysContextProps {
    currentPPSSurveyForm: Id | undefined;
    changeCurrentPPSSurveyForm: (surveyId: Id | undefined) => void;

    currentCountryQuestionnaire: { id: Id; orgUnitId: Id } | undefined;
    changeCurrentCountryQuestionnaire: (surveyId: Id, orgUnitId: Id) => void;
    resetCurrentCountryQuestionnaire: () => void;

    currentHospitalForm: { id: Id; orgUnitId: Id } | undefined;
    changeCurrentHospitalForm: (surveyId: Id, orgUnitId: Id) => void;
    resetCurrentHospitalForm: () => void;

    currentWardRegister: Id | undefined;
    changeCurrentWardRegister: (surveyId: Id | undefined) => void;
    resetCurrentWardRegister: () => void;
}

export const CurrentSurveysContext = createContext<CurrentSurveysContextProps>({
    currentPPSSurveyForm: undefined,
    changeCurrentPPSSurveyForm: () => {},

    currentCountryQuestionnaire: undefined,
    resetCurrentCountryQuestionnaire: () => {},
    changeCurrentCountryQuestionnaire: () => {},

    currentHospitalForm: undefined,
    changeCurrentHospitalForm: () => {},
    resetCurrentHospitalForm: () => {},

    currentWardRegister: undefined,
    changeCurrentWardRegister: () => {},
    resetCurrentWardRegister: () => {},
});

export function useCurrentSurveys() {
    const context = useContext(CurrentSurveysContext);
    if (context) {
        return context;
    } else {
        throw new Error("Current surveys context uninitialized");
    }
}
