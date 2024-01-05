import { useState } from "react";
import { useHistory } from "react-router-dom";
import { Id } from "../../../../domain/entities/Ref";
import { Survey, SurveyBase, SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import {
    getChildSurveyType,
    getFormTypeFromOption,
    getSurveyOptions,
    PREVALENCE_PATIENT_OPTIONS,
} from "../../../../domain/utils/PPSProgramsHelper";
import _ from "../../../../domain/entities/generic/Collection";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";
import { useCurrentModule } from "../../../contexts/current-module-context";
import { getUserAccess } from "../../../../domain/utils/menuHelper";
import { useAppContext } from "../../../contexts/app-context";

export type SortDirection = "asc" | "desc";
export function useSurveyListActions(surveyFormType: SURVEY_FORM_TYPES) {
    const { compositionRoot } = useAppContext();
    const history = useHistory();
    const [options, setOptions] = useState<string[]>([]);
    const [sortedSurveys, setSortedSurveys] = useState<Survey[]>();
    const [optionLoading, setOptionLoading] = useState<boolean>(false);

    const {
        changeCurrentPPSSurveyForm,
        changeCurrentCountryQuestionnaire,
        changeCurrentHospitalForm,
        changeCurrentWardRegister,
        changeCurrentPrevalenceSurveyForm,
        changeCurrentFacilityLevelForm,
    } = useCurrentSurveys();
    const { currentModule } = useCurrentModule();
    const { currentUser } = useAppContext();

    const isAdmin = currentModule
        ? getUserAccess(currentModule, currentUser.userGroups).hasAdminAccess
        : false;

    const editSurvey = (survey: Survey) => {
        updateSelectedSurveyDetails(
            {
                id: survey.id,
                name: survey.name,
                surveyType: survey.surveyType,
            },
            survey.assignedOrgUnit.id,
            survey.rootSurvey
        );
        history.push({
            pathname: `/survey/${surveyFormType}/${survey.id}`,
        });
    };

    const assignChild = (survey: Survey) => {
        updateSelectedSurveyDetails(
            {
                id: survey.id,
                name: survey.name,
                surveyType: survey.surveyType,
            },
            survey.assignedOrgUnit.id,
            survey.rootSurvey
        );
        const childSurveyType = getChildSurveyType(surveyFormType, survey.surveyType);
        if (childSurveyType) {
            history.push({
                pathname: `/new-survey/${childSurveyType}`,
            });
        } else {
            console.debug("An error occured, unknown survey type");
        }
    };

    const listChildren = (survey: Survey) => {
        updateSelectedSurveyDetails(
            {
                id: survey.id,
                name: survey.name,
                surveyType: survey.surveyType,
            },
            survey.assignedOrgUnit.id,
            survey.rootSurvey
        );
        const childSurveyType = getChildSurveyType(surveyFormType, survey.surveyType);
        if (childSurveyType)
            history.replace({
                pathname: `/surveys/${childSurveyType}`,
            });
        else {
            console.debug("An error occured, unknown survey type");
        }
    };

    const actionClick = (ppsSurveyType: string, survey?: Survey) => {
        setOptionLoading(true);
        const currentOptions = getSurveyOptions(surveyFormType, ppsSurveyType);

        if (!survey) {
            setOptions(currentOptions);
            setOptionLoading(false);
            return;
        }

        compositionRoot.surveys.getChildCount
            .execute(
                surveyFormType,
                survey.assignedOrgUnit.id,
                survey.rootSurvey.id,
                surveyFormType === "PPSWardRegister" ? survey.id : ""
            )
            .run(
                childCount => {
                    const optionsWithChildCount = currentOptions.map(option => {
                        if (option.startsWith("List")) {
                            const updatedOption = `${option} (${childCount})`;
                            return updatedOption;
                        }
                        return option;
                    });
                    if (survey) survey.childCount = childCount;
                    setOptions(optionsWithChildCount);
                    setOptionLoading(false);
                },
                err => {
                    console.debug(`Could not get child count, error : ${err}`);
                    setOptions(currentOptions);
                    setOptionLoading(false);
                }
            );
    };

    const sortByColumn = (columnName: keyof Survey, sortDirection: SortDirection) => {
        setSortedSurveys(surveys => {
            if (surveys)
                return _(surveys)
                    .sortBy(x => x[columnName], { direction: sortDirection })
                    .value();
        });
    };

    const updateSelectedSurveyDetails = (
        survey: SurveyBase,
        orgUnitId: Id,
        rootSurvey: SurveyBase
    ) => {
        if (surveyFormType === "PPSSurveyForm") changeCurrentPPSSurveyForm(survey);
        else if (surveyFormType === "PPSCountryQuestionnaire")
            changeCurrentCountryQuestionnaire(survey.id, survey.name, orgUnitId);
        else if (surveyFormType === "PPSHospitalForm") {
            if (!isAdmin) {
                changeCurrentPPSSurveyForm(rootSurvey);
            }
            changeCurrentHospitalForm(survey.id, survey.name, orgUnitId);
        } else if (surveyFormType === "PPSWardRegister") changeCurrentWardRegister(survey);
        else if (surveyFormType === "PrevalenceSurveyForm")
            changeCurrentPrevalenceSurveyForm(survey.id, survey.name, orgUnitId);
        else if (surveyFormType === "PrevalenceFacilityLevelForm")
            changeCurrentFacilityLevelForm(survey.id, survey.name, orgUnitId);
    };

    const handleSplitButtonClick = (
        option:
            | (typeof PREVALENCE_PATIENT_OPTIONS)[0]
            | (typeof PREVALENCE_PATIENT_OPTIONS)[1]
            | (typeof PREVALENCE_PATIENT_OPTIONS)[2]
            | (typeof PREVALENCE_PATIENT_OPTIONS)[3]
            | (typeof PREVALENCE_PATIENT_OPTIONS)[4]
    ) => {
        const formType = getFormTypeFromOption(option);
        if (formType)
            history.push({
                pathname: `/new-survey/${formType}`,
            });
    };

    return {
        options,
        sortedSurveys,
        optionLoading,
        setSortedSurveys,
        editSurvey,
        assignChild,
        listChildren,
        actionClick,
        sortByColumn,
        handleSplitButtonClick,
    };
}
