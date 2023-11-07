import { useAppContext } from "../../../contexts/app-context";
import { Questionnaire } from "../../../../domain/entities/Questionnaire";
import { SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import { Id } from "../../../../domain/entities/Ref";
import { useState } from "react";
import i18n from "@eyeseetea/feedback-component/locales";

export interface SaveState {
    status: "success" | "error";
    message: string;
}
export function useSaveSurvey(
    formType: SURVEY_FORM_TYPES,
    orgUnitId: Id,
    surveyId?: Id | undefined
) {
    const { compositionRoot } = useAppContext();
    const [saveCompleteState, setSaveCompleteState] = useState<SaveState>();

    const saveSurvey = (questionnaire: Questionnaire) => {
        compositionRoot.surveys.saveFormData
            .execute(formType, questionnaire, orgUnitId, surveyId)
            .run(
                () => {
                    setSaveCompleteState({
                        status: "success",
                        message: i18n.t("Submission Success!"),
                    });
                },
                () => {
                    setSaveCompleteState({
                        status: "error",
                        message: i18n.t(
                            "Submission Failed! You do not have the necessary permissions, please contact your administrator"
                        ),
                    });
                }
            );
    };

    return { saveCompleteState, saveSurvey };
}
