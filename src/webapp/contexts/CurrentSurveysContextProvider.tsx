import { PropsWithChildren, useState } from "react";
import { Id, NamedRef } from "../../domain/entities/Ref";
import { CurrentSurveysContext } from "./current-surveys-context";

export const CurrentSurveysContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [currentPPSSurveyForm, setCurrentPPSSurveyForm] = useState<{
        id: Id;
        name: string;
        surveyType: string;
    }>();
    const [currentCountryQuestionnaire, setCurrentCountryQuestionnaire] = useState<{
        id: string;
        name: string;
        orgUnitId: string;
    }>();
    const [currentHospitalForm, setCurrentHospitalForm] = useState<{
        id: string;
        name: string;
        orgUnitId: string;
    }>();
    const [currentWardRegister, setCurrentWardRegister] = useState<NamedRef>();

    const changeCurrentPPSSurveyForm = (
        survey: { id: Id; name: string; surveyType: string } | undefined
    ) => {
        setCurrentPPSSurveyForm(survey);
    };

    const resetCurrentPPSSurveyForm = () => {
        setCurrentPPSSurveyForm(undefined);
        resetCurrentCountryQuestionnaire();
        resetCurrentHospitalForm();
        resetCurrentWardRegister();
    };

    const changeCurrentCountryQuestionnaire = (id: Id, name: string, orgUnitId: Id) => {
        setCurrentCountryQuestionnaire({ id: id, name: name, orgUnitId: orgUnitId });
    };

    const resetCurrentCountryQuestionnaire = () => {
        setCurrentCountryQuestionnaire(undefined);
        resetCurrentHospitalForm();
        resetCurrentWardRegister();
    };

    const changeCurrentHospitalForm = (id: Id, name: string, orgUnitId: Id) => {
        setCurrentHospitalForm({ id: id, name: name, orgUnitId: orgUnitId });
    };

    const resetCurrentHospitalForm = () => {
        setCurrentHospitalForm(undefined);
        resetCurrentWardRegister();
    };

    const changeCurrentWardRegister = (ward: NamedRef | undefined) => {
        setCurrentWardRegister(ward);
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
