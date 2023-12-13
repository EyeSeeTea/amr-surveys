import { useEffect, useState } from "react";
import { useAppContext } from "../../../contexts/app-context";
import { Questionnaire, QuestionnaireSection } from "../../../../domain/entities/Questionnaire";
import { SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import { OrgUnitAccess } from "../../../../domain/entities/User";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";

export function useSurveyForm(formType: SURVEY_FORM_TYPES, eventId: string | undefined) {
    const { compositionRoot, currentUser } = useAppContext();
    const [questionnaire, setQuestionnaire] = useState<Questionnaire>();
    const [loading, setLoading] = useState<boolean>(false);
    const [currentOrgUnit, setCurrentOrgUnit] = useState<OrgUnitAccess>();
    const {
        currentPPSSurveyForm,
        currentHospitalForm,
        currentWardRegister,
        currentPrevalenceSurveyForm,
    } = useCurrentSurveys();
    const [error, setError] = useState<string>();

    const addNew = (prevSection: QuestionnaireSection) => {
        setQuestionnaire(prevQuestionnaire => {
            if (prevQuestionnaire) {
                const stageToUpdate = prevQuestionnaire?.stages.find(
                    stage => stage.code === prevSection.stageId
                );

                const sectionToUpdate = stageToUpdate?.sections.find(
                    section => section.sortOrder === prevSection.sortOrder + 1
                );

                return {
                    ...prevQuestionnaire,
                    stages: prevQuestionnaire.stages.map(stage => {
                        if (stage.code !== stageToUpdate?.code) return stage;
                        else {
                            return {
                                ...stage,
                                sections: stage.sections.map(section => {
                                    if (section.code !== sectionToUpdate?.code) return section;
                                    else {
                                        return {
                                            ...section,
                                            isVisible: true,
                                            questions: section.questions.map(q => {
                                                if (q.id === section.showAddQuestion) {
                                                    q.value = true;
                                                    return q;
                                                } else return q;
                                            }),
                                        };
                                    }
                                }),
                            };
                        }
                    }),
                };
            }
        });
    };

    useEffect(() => {
        setLoading(true);
        if (!eventId) {
            //If Event id not specified, load an Empty Questionnaire form
            return compositionRoot.surveys.getForm
                .execute(
                    formType,
                    currentPPSSurveyForm?.id,
                    currentWardRegister?.id,
                    currentPrevalenceSurveyForm?.id
                )
                .run(
                    questionnaireForm => {
                        setQuestionnaire(questionnaireForm);
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
                    : undefined;

            //If Event Id has been specified, pre-populate event data in Questionnaire form
            return compositionRoot.surveys.getPopulatedForm
                .execute(eventId, formType, orgUnitId)
                .run(
                    questionnaireWithData => {
                        setQuestionnaire(questionnaireWithData);

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
                            const currentHospital = currentUser.userHospitalsAccess.find(
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
        currentUser.userHospitalsAccess,
        setError,
        currentHospitalForm,
        currentWardRegister,

        currentPrevalenceSurveyForm,
    ]);

    return {
        questionnaire,
        setQuestionnaire,
        loading,
        currentOrgUnit,
        setCurrentOrgUnit,
        setLoading,
        error,
        addNew,
    };
}
