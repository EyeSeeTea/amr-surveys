import { useEffect, useState } from "react";
import {
    Survey,
    SURVEY_FORM_TYPES,
    SURVEY_STATUSES,
    SURVEY_TYPES,
} from "../../../../domain/entities/Survey";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";

export function useSurveyList(
    surveyFormType: SURVEY_FORM_TYPES,
    isAdmin: boolean,
    surveys: Survey[] | undefined
) {
    const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>();
    const [statusFilter, setStatusFilter] = useState<SURVEY_STATUSES>();
    const [surveyTypeFilter, setSurveyTypeFilter] = useState<SURVEY_TYPES>();

    const {
        resetCurrentPPSSurveyForm,
        resetCurrentCountryQuestionnaire,
        resetCurrentHospitalForm,
        resetCurrentWardRegister,
    } = useCurrentSurveys();

    useEffect(() => {
        if (surveyFormType === "PPSHospitalForm" && !isAdmin) {
            resetCurrentPPSSurveyForm();
        }

        if (surveyFormType === "PPSSurveyForm") {
            resetCurrentCountryQuestionnaire();
        } else if (surveyFormType === "PPSCountryQuestionnaire") {
            resetCurrentCountryQuestionnaire();
            setStatusFilter(undefined);
            setSurveyTypeFilter(undefined);
        } else if (surveyFormType === "PPSHospitalForm") {
            resetCurrentHospitalForm();
            setStatusFilter(undefined);
            setSurveyTypeFilter(undefined);
        } else if (surveyFormType === "PPSWardRegister") {
            resetCurrentWardRegister();
            setStatusFilter(undefined);
            setSurveyTypeFilter(undefined);
        }

        if (statusFilter && surveyTypeFilter && surveys) {
            //Apply both filters
            const filteredList = surveys.filter(
                survey => survey.status === statusFilter && survey.surveyType === surveyTypeFilter
            );
            setFilteredSurveys(filteredList);
        } else if (statusFilter && surveys) {
            //Apply only status filter
            const filteredList = surveys.filter(survey => survey.status === statusFilter);
            setFilteredSurveys(filteredList);
        } else if (surveyTypeFilter && surveys) {
            //Apply only survey type filter
            const filteredList = surveys.filter(survey => survey.surveyType === surveyTypeFilter);
            setFilteredSurveys(filteredList);
        } else {
            //all surveys
            setFilteredSurveys(surveys);
        }
    }, [
        isAdmin,
        surveyFormType,
        resetCurrentPPSSurveyForm,
        resetCurrentCountryQuestionnaire,
        resetCurrentHospitalForm,
        resetCurrentWardRegister,
        surveys,
        statusFilter,
        surveyTypeFilter,
    ]);

    return {
        statusFilter,
        setStatusFilter,
        surveyTypeFilter,
        setSurveyTypeFilter,
        filteredSurveys,
    };
}
