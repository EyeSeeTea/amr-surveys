import { PropsWithChildren, useState } from "react";
import { Id, NamedRef } from "../../domain/entities/Ref";
import {
    OrgUnitNamedRef,
    PrevalenceSurveyForm,
    SurveyBase,
    OrgUnitWithCodeRef,
} from "../../domain/entities/Survey";
import { CurrentSurveysContext } from "./current-surveys-context";
import { ASTGUIDELINE_TYPES } from "../../domain/entities/ASTGuidelines";

export const CurrentSurveysContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    //PPS Module states
    const [currentPPSSurveyForm, setCurrentPPSSurveyForm] = useState<SurveyBase>();
    const [currentCountryQuestionnaire, setCurrentCountryQuestionnaire] =
        useState<OrgUnitWithCodeRef>();
    const [currentHospitalForm, setCurrentHospitalForm] = useState<OrgUnitNamedRef>();
    const [currentWardRegister, setCurrentWardRegister] = useState<NamedRef>();

    //Prevalence Module states
    const [currentPrevalenceSurveyForm, setCurrentPrevalenceSurveyForm] =
        useState<PrevalenceSurveyForm>();
    const [currentFacilityLevelForm, setCurrentFacilityLevelForm] = useState<OrgUnitNamedRef>();
    const [currentCaseReportForm, setCurrentCaseReportForm] = useState<NamedRef>();

    //PPS Module functions.
    const changeCurrentPPSSurveyForm = (survey: SurveyBase | undefined) => {
        setCurrentPPSSurveyForm(survey);
    };
    const resetCurrentPPSSurveyForm = () => {
        setCurrentPPSSurveyForm(undefined);
        resetCurrentCountryQuestionnaire();
        resetCurrentHospitalForm();
        resetCurrentWardRegister();
    };

    const changeCurrentCountryQuestionnaire = (id: Id, orgUnitCode: string, orgUnitId: Id) => {
        setCurrentCountryQuestionnaire({ id, orgUnitCode, orgUnitId });
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
    const changeCurrentPrevalenceSurveyForm = (
        id: Id,
        name: string,
        orgUnitId: Id,
        astGuidelines: ASTGUIDELINE_TYPES | undefined
    ) => {
        console.debug("Current AST Guideline is : " + astGuidelines);
        setCurrentPrevalenceSurveyForm({
            id: id,
            name: name,
            orgUnitId: orgUnitId,
            astGuidelines: astGuidelines,
        });
    };

    const resetCurrentPrevalenceSurveyForm = () => {
        setCurrentPrevalenceSurveyForm(undefined);
        resetCurrentFacilityLevelForm();
        resetCurrentCaseReportForm();
    };

    const changeCurrentFacilityLevelForm = (id: Id, name: string, orgUnitId: Id) => {
        setCurrentFacilityLevelForm({ id: id, name: name, orgUnitId: orgUnitId });
    };

    const resetCurrentFacilityLevelForm = () => {
        setCurrentFacilityLevelForm(undefined);
        resetCurrentCaseReportForm();
    };

    const changeCurrentCaseReportForm = (caseReport: NamedRef | undefined) => {
        setCurrentCaseReportForm(caseReport);
    };

    const resetCurrentCaseReportForm = () => {
        setCurrentCaseReportForm(undefined);
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
                currentCaseReportForm,
                changeCurrentCaseReportForm,
                resetCurrentCaseReportForm,
            }}
        >
            {children}
        </CurrentSurveysContext.Provider>
    );
};
