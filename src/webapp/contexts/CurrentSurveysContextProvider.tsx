import { PropsWithChildren, useState } from "react";
import { Id } from "../../domain/entities/Ref";
import { CurrentSurveysContext } from "./current-surveys-context";

export const CurrentSurveysContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [currentPPSSurveyForm, setCurrentPPSSurveyForm] = useState<
        { id: Id; name: string } | undefined
    >();
    const [currentCountryQuestionnaire, setCurrentCountryQuestionnaire] = useState<{
        id: string;
        orgUnitId: string;
    }>();
    const [currentHospitalForm, setCurrentHospitalForm] = useState<{
        id: string;
        orgUnitId: string;
    }>();
    const [currentWardRegister, setCurrentWardRegister] = useState<Id>();

    const changeCurrentPPSSurveyForm = (survey: { id: Id; name: string } | undefined) => {
        setCurrentPPSSurveyForm(survey);
    };

    const resetCurrentPPSSurveyForm = () => {
        console.debug("SNEHA");
        setCurrentPPSSurveyForm(undefined);
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
                resetCurrentPPSSurveyForm,
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
