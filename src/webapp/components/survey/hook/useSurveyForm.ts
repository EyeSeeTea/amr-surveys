import { useEffect, useState } from "react";
import { useAppContext } from "../../../contexts/app-context";
import { Questionnaire } from "../../../../domain/entities/Questionnaire";
import { SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import { Id } from "../../../../domain/entities/Ref";

export function useSurveyForm(
    formType: SURVEY_FORM_TYPES,
    eventId: string | undefined,
    parentSurveyId?: Id | undefined
) {
    const { compositionRoot } = useAppContext();
    const [questionnaire, setQuestionnaire] = useState<Questionnaire>();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>();

    useEffect(() => {
        setLoading(true);
        if (!eventId) {
            //If Event id not specified, load an Empty Questionnaire form
            return compositionRoot.surveys.getForm.execute(formType, parentSurveyId).run(
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
                    setLoading(false);
                },
                err => {
                    setError(err.message);
                    setLoading(false);
                }
            );
        }
    }, [compositionRoot, eventId, formType, parentSurveyId, setError]);

    return { questionnaire, setQuestionnaire, loading, setLoading, error };
}
