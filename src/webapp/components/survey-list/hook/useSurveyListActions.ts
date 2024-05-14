import { useState } from "react";
import { useHistory } from "react-router-dom";
import { Id } from "../../../../domain/entities/Ref";
import { Survey, SurveyBase, SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import { getChildSurveyType, getSurveyOptions } from "../../../../domain/utils/PPSProgramsHelper";
import _ from "../../../../domain/entities/generic/Collection";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";
import { useCurrentModule } from "../../../contexts/current-module-context";
import { getUserAccess } from "../../../../domain/utils/menuHelper";
import { useAppContext } from "../../../contexts/app-context";
import { OptionType } from "../../../../domain/utils/optionsHelper";
import useReadOnlyAccess from "../../survey/hook/useReadOnlyAccess";
import useCaptureAccess from "../../survey/hook/useCaptureAccess";
import { GLOBAL_OU_ID } from "../../../../domain/usecases/SaveFormDataUseCase";
import { useCurrentASTGuidelinesContext } from "../../../contexts/current-ast-guidelines-context";

export type SortDirection = "asc" | "desc";
export function useSurveyListActions(surveyFormType: SURVEY_FORM_TYPES) {
    const { compositionRoot } = useAppContext();
    const history = useHistory();
    const [options, setOptions] = useState<OptionType[]>([]);
    const [sortedSurveys, setSortedSurveys] = useState<Survey[]>();
    const [optionLoading, setOptionLoading] = useState<boolean>(false);

    const {
        changeCurrentPPSSurveyForm,
        changeCurrentCountryQuestionnaire,
        changeCurrentHospitalForm,
        changeCurrentWardRegister,
        changeCurrentPrevalenceSurveyForm,
        changeCurrentFacilityLevelForm,
        changeCurrentCaseReportForm,
    } = useCurrentSurveys();
    const { currentModule } = useCurrentModule();
    const { currentUser } = useAppContext();
    const { hasReadOnlyAccess } = useReadOnlyAccess();
    const { hasCaptureAccess } = useCaptureAccess();
    const { changeCurrentASTGuidelines } = useCurrentASTGuidelinesContext();

    const isAdmin = currentModule
        ? getUserAccess(currentModule, currentUser.userGroups).hasAdminAccess
        : false;

    const goToSurvey = (survey: Survey) => {
        updateSelectedSurveyDetails(
            {
                id: survey.id,
                name: survey.name,
                surveyType: survey.surveyType,
                astGuideline: survey.astGuideline,
            },
            survey.assignedOrgUnit.id,
            survey.rootSurvey
        );
        history.push({
            pathname: `/survey/${surveyFormType}/${survey.id}`,
        });
    };

    const assignChild = (survey: Survey, option?: string) => {
        updateSelectedSurveyDetails(
            {
                id: survey.id,
                name: survey.name,
                surveyType: survey.surveyType,
                astGuideline: survey.astGuideline,
            },
            survey.assignedOrgUnit.id,
            survey.rootSurvey
        );
        const childSurveyType = getChildSurveyType(surveyFormType, survey.surveyType, option);
        if (childSurveyType) {
            history.push({
                pathname: `/new-survey/${childSurveyType}`,
            });
        } else {
            console.debug("An error occured, unknown survey type");
        }
    };

    const listChildren = (survey: Survey, option?: string) => {
        updateSelectedSurveyDetails(
            {
                id: survey.id,
                name: survey.name,
                surveyType: survey.surveyType,
                astGuideline: survey.astGuideline,
            },
            survey.assignedOrgUnit.id,
            survey.rootSurvey
        );
        const childSurveyType = getChildSurveyType(surveyFormType, survey.surveyType, option);
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
        const currentOptions = getSurveyOptions(
            surveyFormType,
            hasReadOnlyAccess,
            hasCaptureAccess,
            ppsSurveyType
        );
        if (!survey) {
            setOptions(currentOptions);
            setOptionLoading(false);
            return;
        }
        const { childCount } = survey;

        if (typeof childCount === "number") {
            const optionsWithChildCount = currentOptions.map(option => {
                if (option.label.startsWith("List")) {
                    const updatedLabel = `${option.label} (${childCount})`;
                    return { ...option, label: updatedLabel };
                }
                return option;
            });
            setOptions(optionsWithChildCount);
            setOptionLoading(false);
        } else {
            const optionsWithChildCount = currentOptions.map(option => {
                const updatedChilsOptionMap = childCount?.find(childMap =>
                    childMap.option.label.startsWith(option.label)
                );
                if (updatedChilsOptionMap) {
                    return updatedChilsOptionMap.option;
                } else {
                    return option;
                }
            });

            setOptions(optionsWithChildCount);
            setOptionLoading(false);
        }
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
        else if (surveyFormType === "PrevalenceSurveyForm") {
            changeCurrentPrevalenceSurveyForm(
                survey.id,
                survey.name,
                orgUnitId,
                survey.astGuideline
            );
            //when current astGuideline changes, fetch the corresponding ast guidelines from datstore
            if (survey.astGuideline)
                compositionRoot.astGuidelines.getGuidelines
                    .execute(survey.astGuideline, survey.id)
                    .run(
                        astGuidelines => {
                            changeCurrentASTGuidelines(astGuidelines);
                            console.debug(
                                "AST Guidelines data fetched successfully, AST guidelines data set"
                            );
                        },
                        err => {
                            console.debug(` No AST guidelines data could be fetched : ${err}`);
                        }
                    );
        } else if (surveyFormType === "PrevalenceFacilityLevelForm") {
            if (!isAdmin) {
                changeCurrentPrevalenceSurveyForm(
                    rootSurvey.id,
                    rootSurvey.name,
                    GLOBAL_OU_ID,
                    rootSurvey.astGuideline
                );
                //when current astGuideline changes, fetch the corresponding ast guidelines from datstore
                if (rootSurvey.astGuideline)
                    compositionRoot.astGuidelines.getGuidelines
                        .execute(rootSurvey.astGuideline, rootSurvey.id)
                        .run(
                            astGuidelines => {
                                changeCurrentASTGuidelines(astGuidelines);
                                console.debug(
                                    "AST Guidelines data fetched successfully, AST guidelines data set"
                                );
                            },
                            err => {
                                console.debug(` No AST guidelines data could be fetched : ${err}`);
                            }
                        );
            }
            changeCurrentFacilityLevelForm(survey.id, survey.name, orgUnitId);
        } else if (surveyFormType === "PrevalenceCaseReportForm")
            changeCurrentCaseReportForm({ id: survey.id, name: survey.name });
    };

    return {
        options,
        sortedSurveys,
        optionLoading,
        setSortedSurveys,
        goToSurvey,
        assignChild,
        listChildren,
        actionClick,
        sortByColumn,
    };
}
