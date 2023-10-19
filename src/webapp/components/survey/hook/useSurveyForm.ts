import { useEffect, useState } from "react";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import { useAppContext } from "../../../contexts/app-context";
import { Questionnaire } from "../../../../domain/entities/Questionnaire";
import { SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";

export function useSurveyForm(formType: SURVEY_FORM_TYPES, eventId: string | undefined) {
    const { compositionRoot } = useAppContext();
    const [questionnaire, setQuestionnaire] = useState<Questionnaire>();
    const [loading, setLoading] = useState<boolean>(false);
    const snackbar = useSnackbar();

    useEffect(() => {
        setLoading(true);
        if (!eventId) {
            //If Event id not specified, load an Empty Questionnaire form
            return compositionRoot.surveys.getForm.execute(formType).run(
                questionnaireForm => {
                    setQuestionnaire(questionnaireForm);
                    setLoading(false);
                },
                err => {
                    snackbar.error(err.message);
                    setLoading(false);
                }
            );
        }
        //TO DO :  Populated form
        // else {
        //     //If Event Id has been specified, pre-populate event data in Questionnaire form
        //     return compositionRoot.surveys.getSignal(eventId).run(
        //         questionnaireWithData => {
        //             console.debug(questionnaireWithData);
        //             setQuestionnaire(questionnaireWithData);
        //             setLoading(false);
        //         },
        //         err => {
        //             snackbar.error(err);
        //             setLoading(false);
        //         }
        //     );
        // }
    }, [compositionRoot, snackbar, eventId, formType]);

    return { questionnaire, setQuestionnaire, loading, setLoading };
}
