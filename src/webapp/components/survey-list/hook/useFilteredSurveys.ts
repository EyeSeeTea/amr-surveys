import { useCallback, useEffect, useState } from "react";
import {
    Survey,
    SURVEY_FORM_TYPES,
    SURVEY_STATUSES,
    SURVEY_TYPES,
} from "../../../../domain/entities/Survey";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";
import { useAppContext } from "../../../contexts/app-context";
import { GLOBAL_OU_ID } from "../../../../domain/usecases/SaveFormDataUseCase";
import { PAGE_SIZE, SortColumnDetails } from "../../../../domain/entities/TablePagination";

export function useFilteredSurveys(
    surveyFormType: SURVEY_FORM_TYPES,
    isAdmin: boolean,
    surveys: Survey[] | undefined,
    setPageSize: React.Dispatch<React.SetStateAction<number>>,
    setTotal: React.Dispatch<React.SetStateAction<number | undefined>>,
    sortColumnDetails?: SortColumnDetails
) {
    const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>();
    const [statusFilter, setStatusFilter] = useState<SURVEY_STATUSES>();
    const [surveyTypeFilter, setSurveyTypeFilter] = useState<SURVEY_TYPES>();
    const [isFilterLoading, setIsFilterLoading] = useState<boolean>(false);

    const { compositionRoot } = useAppContext();
    const {
        resetCurrentPPSSurveyForm,
        resetCurrentCountryQuestionnaire,
        resetCurrentHospitalForm,
        resetCurrentWardRegister,
        resetCurrentFacilityLevelForm,
    } = useCurrentSurveys();

    useEffect(() => {
        //filters apply only to PPSSurveyForm
        if (surveyFormType !== "PPSSurveyForm" && surveyFormType !== "PrevalenceSurveyForm") {
            setStatusFilter(undefined);
            setSurveyTypeFilter(undefined);
        }

        //For non-admin user, reset context for any corner cases.
        if (surveyFormType === "PPSHospitalForm" && !isAdmin) {
            resetCurrentPPSSurveyForm();
        }

        //reset child contexts, if parent is reset
        if (surveyFormType === "PPSSurveyForm") {
            resetCurrentCountryQuestionnaire();
        } else if (surveyFormType === "PPSCountryQuestionnaire") {
            resetCurrentCountryQuestionnaire();
        } else if (surveyFormType === "PPSHospitalForm") {
            resetCurrentHospitalForm();
        } else if (surveyFormType === "PPSWardRegister") {
            resetCurrentWardRegister();
        } else if (surveyFormType === "PrevalenceSurveyForm") {
            resetCurrentFacilityLevelForm();
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
        resetCurrentFacilityLevelForm,
    ]);

    const handleSurveyTypeFilter = useCallback(
        (surveyType: SURVEY_TYPES | undefined) => {
            setIsFilterLoading(true);
            setSurveyTypeFilter(surveyType);
            compositionRoot.surveys.getFilteredRootSurveysUseCase
                .execute(GLOBAL_OU_ID, surveyType, 0, PAGE_SIZE, sortColumnDetails)
                .run(
                    filteredSurveys => {
                        setFilteredSurveys(filteredSurveys.objects);
                        setTotal(filteredSurveys.pager.total);
                        setPageSize(filteredSurveys.pager.pageSize);
                        setIsFilterLoading(false);
                    },
                    err => {
                        console.debug(err);
                        setIsFilterLoading(false);
                    }
                );
        },
        [
            compositionRoot.surveys.getFilteredRootSurveysUseCase,
            setPageSize,
            setTotal,
            sortColumnDetails,
        ]
    );

    return {
        statusFilter,
        setStatusFilter,
        surveyTypeFilter,
        handleSurveyTypeFilter,
        filteredSurveys,
        isFilterLoading,
    };
}
