import { useState } from "react";
import { SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";

import { useAppContext } from "../../../contexts/app-context";
import i18n from "@eyeseetea/feedback-component/locales";
import { Id } from "../../../../domain/entities/Ref";

export interface DeleteState {
    status: "success" | "error";
    message: string;
}

export function useDeleteSurvey(formType: SURVEY_FORM_TYPES, refreshSurveys: any) {
    const { compositionRoot } = useAppContext();
    const [deleteCompleteState, setDeleteCompleteState] = useState<DeleteState>();
    const { currentHospitalForm } = useCurrentSurveys();

    const deleteSurvey = (surveyId: Id, orgUnitId: Id) => {
        if (formType === "PPSWardRegister" || formType === "PPSPatientRegister")
            orgUnitId = currentHospitalForm?.orgUnitId ?? "";
        compositionRoot.surveys.deleteSurvey.execute(formType, orgUnitId, surveyId).run(
            () => {
                setDeleteCompleteState({
                    status: "success",
                    message: i18n.t("Survey deleted!"),
                });
                refreshSurveys({});
            },
            err => {
                setDeleteCompleteState({
                    status: "error",
                    message: err ? err.message : i18n.t("Error deleting the survery"),
                });
            }
        );
    };

    return { deleteCompleteState, deleteSurvey };
}