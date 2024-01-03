import { PropsWithChildren, useState } from "react";
import { Id, NamedRef } from "../../domain/entities/Ref";
import { OrgUnitNamedRef, SurveyBase } from "../../domain/entities/Survey";
import { CurrentSurveysContext } from "./current-surveys-context";

export const CurrentSurveysContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    //PPS Module states
    const [currentPPSSurveyForm, setCurrentPPSSurveyForm] = useState<SurveyBase>();
    const [currentCountryQuestionnaire, setCurrentCountryQuestionnaire] =
        useState<OrgUnitNamedRef>();
    const [currentHospitalForm, setCurrentHospitalForm] = useState<OrgUnitNamedRef>();
    const [currentWardRegister, setCurrentWardRegister] = useState<NamedRef>();

    const changeCurrentPPSSurveyForm = (survey: SurveyBase | undefined) => {
        setCurrentPPSSurveyForm(survey);
    };
    //Prevalenc Module states
    const [currentPrevalenceSurveyForm, setCurrentPrevalenceSurveyForm] =
        useState<OrgUnitNamedRef>();
    const [currentFacilityLevelForm, setCurrentFacilityLevelForm] = useState<OrgUnitNamedRef>();

    //PPS Module functions.
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

    //Prevalence Module functions.
    const changeCurrentPrevalenceSurveyForm = (id: Id, name: string, orgUnitId: Id) => {
        setCurrentPrevalenceSurveyForm({ id: id, name: name, orgUnitId: orgUnitId });
    };

    const resetCurrentPrevalenceSurveyForm = () => {
        setCurrentPrevalenceSurveyForm(undefined);
        resetCurrentFacilityLevelForm();
    };

    const changeCurrentFacilityLevelForm = (id: Id, name: string, orgUnitId: Id) => {
        setCurrentFacilityLevelForm({ id: id, name: name, orgUnitId: orgUnitId });
    };

    const resetCurrentFacilityLevelForm = () => {
        setCurrentFacilityLevelForm(undefined);
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

                currentPrevalenceSurveyForm,
                changeCurrentPrevalenceSurveyForm,
                resetCurrentPrevalenceSurveyForm,
                currentFacilityLevelForm,
                changeCurrentFacilityLevelForm,
                resetCurrentFacilityLevelForm,
            }}
        >
            {children}
        </CurrentSurveysContext.Provider>
    );
};
