import { useContext, createContext } from "react";
import { Id, NamedRef } from "../../domain/entities/Ref";

export interface CurrentSurveysContextProps {
    currentPPSSurveyForm: { id: Id; name: string; surveyType: string } | undefined;
    changeCurrentPPSSurveyForm: (
        survey: { id: Id; name: string; surveyType: string } | undefined
    ) => void;
    resetCurrentPPSSurveyForm: () => void;

    currentCountryQuestionnaire: { id: Id; name: string; orgUnitId: Id } | undefined;
    changeCurrentCountryQuestionnaire: (id: Id, name: string, orgUnitId: Id) => void;
    resetCurrentCountryQuestionnaire: () => void;

    currentHospitalForm: { id: Id; name: string; orgUnitId: Id } | undefined;
    changeCurrentHospitalForm: (id: Id, name: string, orgUnitId: Id) => void;
    resetCurrentHospitalForm: () => void;

    currentWardRegister: NamedRef | undefined;
    changeCurrentWardRegister: (ward: NamedRef | undefined) => void;
    resetCurrentWardRegister: () => void;
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
});

export function useCurrentSurveys() {
    const context = useContext(CurrentSurveysContext);
    if (context) {
        return context;
    } else {
        throw new Error("Current surveys context uninitialized");
    }
}
