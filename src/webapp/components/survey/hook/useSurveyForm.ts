import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../../contexts/app-context";
import {
    Questionnaire,
    QuestionnaireStage,
} from "../../../../domain/entities/Questionnaire/Questionnaire";
import { SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import { OrgUnitAccess } from "../../../../domain/entities/User";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";

import useReadOnlyAccess from "./useReadOnlyAccess";
import { useCurrentModule } from "../../../contexts/current-module-context";
import { Code, Question } from "../../../../domain/entities/Questionnaire/QuestionnaireQuestion";
import { Id } from "../../../../domain/entities/Ref";
import { Maybe } from "../../../../utils/ts-utils";
import _c from "../../../../domain/entities/generic/Collection";

type RepeatableStage = {
    title: string;
    sortOrder: number;
    repeatable: boolean;
    isVisible: boolean;
    code: Code;
    repeatableStages: QuestionnaireStage[];
};

type SurveyStage = QuestionnaireStage | RepeatableStage;

export function useSurveyForm(formType: SURVEY_FORM_TYPES, eventId: string | undefined) {
    const { compositionRoot, currentUser, ppsHospitals, prevalenceHospitals } = useAppContext();
    const [questionnaire, setQuestionnaire] = useState<Questionnaire>();
    const [loading, setLoading] = useState<boolean>(false);
    const [currentOrgUnit, setCurrentOrgUnit] = useState<OrgUnitAccess>();
    const [shouldDisableSave, setShouldDisableSave] = useState<boolean>(false);
    const {
        currentPPSSurveyForm,
        currentHospitalForm,
        currentWardRegister,
        currentPrevalenceSurveyForm,
        currentFacilityLevelForm,
        currentCaseReportForm,
    } = useCurrentSurveys();
    const { hasReadOnlyAccess } = useReadOnlyAccess();

    const [error, setError] = useState<string>();
    const { currentModule } = useCurrentModule();

    useEffect(() => {
        if (!questionnaire) setShouldDisableSave(true);
        else {
            const shouldDisable = Questionnaire.doesQuestionnaireHaveErrors(questionnaire);
            setShouldDisableSave(shouldDisable || hasReadOnlyAccess);
        }
    }, [hasReadOnlyAccess, questionnaire]);

    useEffect(() => {
        setLoading(true);
        if (!eventId) {
            //If Event id not specified, load an Empty Questionnaire form
            return compositionRoot.surveys.getForm
                .execute(
                    formType,
                    currentPPSSurveyForm?.id,
                    currentWardRegister?.id,
                    currentPrevalenceSurveyForm?.id,
                    currentCaseReportForm?.id
                )
                .run(
                    questionnaireForm => {
                        //apply rules, if any
                        if (
                            (questionnaireForm.rules && questionnaireForm.rules?.length > 0) ||
                            (currentModule && currentModule?.rulesBySurvey?.length > 0)
                        ) {
                            const processedQuestionnaire =
                                compositionRoot.surveys.applyInitialRules.execute(
                                    questionnaireForm,
                                    currentModule,
                                    currentPPSSurveyForm?.id,
                                    currentPrevalenceSurveyForm?.id
                                );
                            setQuestionnaire(processedQuestionnaire);
                        } else setQuestionnaire(questionnaireForm);
                        setLoading(false);
                    },
                    err => {
                        setError(err.message);
                        setLoading(false);
                    }
                );
        } else {
            const orgUnitId =
                formType === "PrevalenceFacilityLevelForm"
                    ? currentPrevalenceSurveyForm?.orgUnitId
                    : formType === "PrevalenceCaseReportForm" ||
                      formType === "PrevalenceCentralRefLabForm" ||
                      formType === "PrevalencePathogenIsolatesLog" ||
                      formType === "PrevalenceSampleShipTrackForm" ||
                      formType === "PrevalenceSupranationalRefLabForm" ||
                      formType === "PrevalenceDischarge" ||
                      formType === "PrevalenceD28FollowUp" ||
                      formType === "PrevalenceCohortEnrolment"
                    ? currentFacilityLevelForm?.orgUnitId
                    : undefined;

            //If Event Id has been specified, pre-populate event data in Questionnaire form
            return compositionRoot.surveys.getPopulatedForm
                .execute(eventId, formType, orgUnitId)
                .run(
                    questionnaireWithData => {
                        //apply rules
                        if (
                            (questionnaireWithData.rules &&
                                questionnaireWithData.rules?.length > 0) ||
                            (currentModule && currentModule?.rulesBySurvey?.length > 0)
                        ) {
                            const processedQuestionnaire =
                                compositionRoot.surveys.applyInitialRules.execute(
                                    questionnaireWithData,
                                    currentModule,
                                    currentPPSSurveyForm?.id,
                                    currentPrevalenceSurveyForm?.id
                                );
                            setQuestionnaire(processedQuestionnaire);
                        } else setQuestionnaire(questionnaireWithData);
                        if (
                            formType === "PPSCountryQuestionnaire" ||
                            formType === "PrevalenceSurveyForm"
                        ) {
                            const currentOrgUnitAccess = currentUser.userCountriesAccess.find(
                                ou => ou.orgUnitId === questionnaireWithData.orgUnit.id
                            );
                            if (currentOrgUnitAccess) {
                                setCurrentOrgUnit(currentOrgUnitAccess);
                            }
                        } else if (formType === "PPSHospitalForm") {
                            const currentHospital = ppsHospitals.find(
                                hospital => hospital.orgUnitId === questionnaireWithData.orgUnit.id
                            );
                            if (currentHospital) {
                                setCurrentOrgUnit(currentHospital);
                            }
                        } else if (formType === "PrevalenceFacilityLevelForm") {
                            const currentHospital = prevalenceHospitals.find(
                                hospital => hospital.orgUnitId === questionnaireWithData.orgUnit.id
                            );
                            if (currentHospital) {
                                setCurrentOrgUnit(currentHospital);
                            }
                        }

                        setLoading(false);
                    },
                    err => {
                        setError(err.message);
                        setLoading(false);
                    }
                );
        }
    }, [
        compositionRoot,
        eventId,
        formType,
        currentPPSSurveyForm,
        currentUser.userCountriesAccess,
        setError,
        currentHospitalForm,
        currentWardRegister,
        currentFacilityLevelForm,
        currentPrevalenceSurveyForm,
        currentModule,
        currentCaseReportForm?.id,
        ppsHospitals,
        prevalenceHospitals,
    ]);

    const updateQuestion = useCallback((question: Question, stageId?: string) => {
        setQuestionnaire(prevQuestionniare => {
            if (prevQuestionniare) {
                const updatedQuestionnaire = Questionnaire.updateQuestionnaire(
                    prevQuestionniare,
                    question,
                    stageId
                );
                return updatedQuestionnaire;
            } else return prevQuestionniare;
        });
    }, []);

    const addProgramStage = useCallback(
        (stageCode: Code) => {
            if (questionnaire) {
                const updatedQuestionnaire = Questionnaire.addProgramStage(
                    questionnaire,
                    stageCode
                );
                setQuestionnaire(updatedQuestionnaire);
            }
        },
        [questionnaire]
    );

    const removeProgramStage = useCallback(
        (stageId: Id) => {
            if (questionnaire) {
                setLoading(true);
                compositionRoot.surveys.removeRepeatableStage.execute(questionnaire, stageId).run(
                    updatedQuestionnaire => {
                        setQuestionnaire(updatedQuestionnaire);
                        setLoading(false);
                    },
                    err => {
                        setLoading(false);
                        setError(`Cannot find event Id corresponding to the stage: ${err.message}`);
                    }
                );
            }
        },
        [compositionRoot.surveys, questionnaire]
    );

    const surveyStages = useMemo(() => {
        return buildSurveyStages(questionnaire);
    }, [questionnaire]);

    return {
        questionnaire,
        surveyStages,
        setQuestionnaire,
        loading,
        currentOrgUnit,
        setCurrentOrgUnit,
        setLoading,
        error,
        shouldDisableSave,
        updateQuestion,
        addProgramStage,
        removeProgramStage,
    };
}

const buildSurveyStages = (questionnaire: Maybe<Questionnaire>): SurveyStage[] => {
    if (!questionnaire) return [];

    const { stages } = questionnaire;
    const nonRepeatableStages = stages.filter(stage => !stage.repeatable);
    const repeatableStages = stages.filter(stage => stage.repeatable);

    const groupedRepeatableStages = _c(repeatableStages)
        .groupBy(stage => stage.title)
        .mapValues(([title, questionnaireStages]) => {
            const questionnaireStage = questionnaireStages[0];
            if (!questionnaireStage) return undefined;

            const { sortOrder, isVisible, code, repeatable } = questionnaireStage;

            return {
                code: code,
                isVisible: isVisible,
                repeatable: repeatable,
                repeatableStages: questionnaireStages,
                sortOrder: sortOrder,
                title: title,
            };
        })
        .values()
        .filter((stage): stage is RepeatableStage => stage !== undefined);

    return _c([...nonRepeatableStages, ...groupedRepeatableStages])
        .sortBy(stage => stage.sortOrder)
        .value();
};
