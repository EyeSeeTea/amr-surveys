import { Dispatch, SetStateAction, useState } from "react";
import { Survey, SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";

import { useAppContext } from "../../../contexts/app-context";
import i18n from "@eyeseetea/feedback-component/locales";
import { Id } from "../../../../domain/entities/Ref";
import { ActionOutcome } from "../../../../domain/entities/generic/ActionOutcome";

export function useDeleteSurvey(
    formType: SURVEY_FORM_TYPES,
    refreshSurveys: Dispatch<SetStateAction<{}>>
) {
    const { compositionRoot } = useAppContext();
    const [loading, setLoading] = useState<boolean>(false);
    const [deleteCompleteState, setDeleteCompleteState] = useState<ActionOutcome>();
    const { currentHospitalForm } = useCurrentSurveys();

    const showDeleteErrorMsg = (survey: Survey) => {
        if (survey.childCount && survey.childCount > 0) {
            setDeleteCompleteState({
                status: "error",
                message: i18n.t(
                    "This survey has other surveys associated with it.\n Please delete all associated surveys, before you can delete this one."
                ),
            });
        } else {
            deleteSurvey(survey.id, survey.assignedOrgUnit.id);
        }
    };

    const deleteSurvey = (surveyId: Id, orgUnitId: Id) => {
        setLoading(true);

        if (formType === "PPSWardRegister" || formType === "PPSPatientRegister")
            orgUnitId = currentHospitalForm?.orgUnitId ?? "";
        compositionRoot.surveys.deleteSurvey.execute(formType, orgUnitId, surveyId).run(
            () => {
                setDeleteCompleteState({
                    status: "success",
                    message: i18n.t("Survey deleted!"),
                });
                refreshSurveys({});
                setLoading(false);
            },
            err => {
                setDeleteCompleteState({
                    status: "error",
                    message: err ? err.message : i18n.t("Error deleting the survery"),
                });

                setLoading(false);
            }
        );
    };

    return {
        deleteCompleteState,
        deleteSurvey,
        loading,
        setLoading,
        showDeleteErrorMsg,
    };
}
