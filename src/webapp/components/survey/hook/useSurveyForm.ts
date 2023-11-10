import { useEffect, useState } from "react";
import { useAppContext } from "../../../contexts/app-context";
import { Questionnaire } from "../../../../domain/entities/Questionnaire";
import { SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import { OrgUnitAccess } from "../../../../domain/entities/User";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";

export function useSurveyForm(formType: SURVEY_FORM_TYPES, eventId: string | undefined) {
    const { compositionRoot, currentUser } = useAppContext();
    const [questionnaire, setQuestionnaire] = useState<Questionnaire>();
    const [loading, setLoading] = useState<boolean>(false);
    const [currentOrgUnit, setCurrentOrgUnit] = useState<OrgUnitAccess>();
    const { currentPPSSurveyForm } = useCurrentSurveys();
    const [error, setError] = useState<string>();

    useEffect(() => {
        setLoading(true);
        if (!eventId) {
            //If Event id not specified, load an Empty Questionnaire form
            return compositionRoot.surveys.getForm.execute(formType, currentPPSSurveyForm).run(
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
            //If Event Id has been specified, pre-populate event data in Questionnaire form
            return compositionRoot.surveys.getPopulatedForm.execute(eventId, formType).run(
                questionnaireWithData => {
                    setQuestionnaire(questionnaireWithData);
                    const currentOrgUnitAccess = currentUser.userOrgUnitsAccess.find(
                        ou => ou.orgUnitId === questionnaireWithData.orgUnit.id
                    );
                    if (currentOrgUnitAccess) {
                        setCurrentOrgUnit(currentOrgUnitAccess);
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
        currentUser.userOrgUnitsAccess,
        setError,
    ]);

    return {
        questionnaire,
        setQuestionnaire,
        loading,
        currentOrgUnit,
        setCurrentOrgUnit,
        setLoading,
        error,
    };
}
