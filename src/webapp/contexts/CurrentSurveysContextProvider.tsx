import { PropsWithChildren, useState } from "react";
import { Id } from "../../domain/entities/Ref";
import { CurrentSurveysContext } from "./current-surveys-context";

export const CurrentSurveysContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [currentPPSSurveyForm, setCurrentPPSSurveyForm] = useState<Id>();
    const [currentCountryQuestionnaire, setCurrentCountryQuestionnaire] = useState<{
        id: string;
        orgUnitId: string;
    }>();
    const [currentHospitalForm, setCurrentHospitalForm] = useState<{
        id: string;
        orgUnitId: string;
    }>();
    const [currentWardRegister, setCurrentWardRegister] = useState<Id>();

    const changeCurrentPPSSurveyForm = (surveyId: Id | undefined) => {
        setCurrentPPSSurveyForm(surveyId);
    };

    const changeCurrentCountryQuestionnaire = (surveyId: Id, orgUnitId: Id) => {
        setCurrentCountryQuestionnaire({ id: surveyId, orgUnitId: orgUnitId });
    };

    const resetCurrentCountryQuestionnaire = () => {
        setCurrentCountryQuestionnaire(undefined);
    };

    const changeCurrentHospitalForm = (surveyId: Id, orgUnitId: Id) => {
        setCurrentHospitalForm({ id: surveyId, orgUnitId: orgUnitId });
    };

    const resetCurrentHospitalForm = () => {
        setCurrentHospitalForm(undefined);
    };

    const changeCurrentWardRegister = (surveyId: Id | undefined) => {
        setCurrentWardRegister(surveyId);
    };

    const resetCurrentWardRegister = () => {
        setCurrentWardRegister(undefined);
    };

    return (
        <CurrentSurveysContext.Provider
            value={{
                currentPPSSurveyForm,
                changeCurrentPPSSurveyForm,
                currentCountryQuestionnaire,
                changeCurrentCountryQuestionnaire,
                resetCurrentCountryQuestionnaire,
                currentHospitalForm,
                changeCurrentHospitalForm,
                resetCurrentHospitalForm,
                currentWardRegister,
                changeCurrentWardRegister,
                resetCurrentWardRegister,
            }}
        >
            {children}
        </CurrentSurveysContext.Provider>
    );
};
