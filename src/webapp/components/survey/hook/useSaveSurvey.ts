import { useAppContext } from "../../../contexts/app-context";
import { Questionnaire } from "../../../../domain/entities/Questionnaire";
import { SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import { Id } from "../../../../domain/entities/Ref";
import { useState } from "react";
import i18n from "@eyeseetea/feedback-component/locales";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";
import { GLOBAL_OU_ID } from "../../../../domain/usecases/SaveFormDataUseCase";

export interface SaveState {
    status: "success" | "error";
    message: string;
}
export function useSaveSurvey(formType: SURVEY_FORM_TYPES, orgUnitId: Id, surveyId?: Id) {
    const { compositionRoot } = useAppContext();
    const [saveCompleteState, setSaveCompleteState] = useState<SaveState>();
    const { currentHospitalForm } = useCurrentSurveys();

    const saveSurvey = (questionnaire: Questionnaire) => {
        if (formType === "PPSWardRegister" || formType === "PPSPatientRegister")
            orgUnitId = currentHospitalForm?.orgUnitId ?? "";
        //TO DO : TEMPORARILY saving all prevelance events to global OU
        else if (formType === "PrevelancePlaceholder") orgUnitId = GLOBAL_OU_ID;
        compositionRoot.surveys.saveFormData
            .execute(formType, questionnaire, orgUnitId, surveyId)
            .run(
                () => {
                    setSaveCompleteState({
                        status: "success",
                        message: i18n.t("Submission Success!"),
                    });
                },
                err => {
                    setSaveCompleteState({
                        status: "error",
                        message: err
                            ? err.message
                            : i18n.t(
                                  "Submission Failed! You do not have the necessary permissions, please contact your administrator"
                              ),
                    });
                }
            );
    };

    return { saveCompleteState, saveSurvey };
}
