import { Dispatch, SetStateAction, useState } from "react";
import { Survey, SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";

import { useAppContext } from "../../../contexts/app-context";
import i18n from "@eyeseetea/feedback-component/locales";
import { Id } from "../../../../domain/entities/Ref";
import { ActionOutcome } from "../../../../domain/entities/generic/ActionOutcome";
import { ASTGUIDELINE_TYPES } from "../../../../domain/entities/ASTGuidelines";

export function useDeleteSurvey(
    formType: SURVEY_FORM_TYPES,
    refreshSurveys: Dispatch<SetStateAction<{}>>
) {
    const { compositionRoot } = useAppContext();
    const [loading, setLoading] = useState<boolean>(false);
    const [deleteCompleteState, setDeleteCompleteState] = useState<ActionOutcome>();
    const { currentHospitalForm } = useCurrentSurveys();

    const showDeleteErrorMsg = (survey: Survey) => {
        const count =
            survey.childCount?.type === "number"
                ? survey.childCount.value
                : survey.childCount?.value
                      ?.map(child => child.count)
                      .reduce((agg, childCount) => agg + childCount, 0) || 0;

        if (survey.childCount && count > 0) {
            setDeleteCompleteState({
                status: "error",
                message: i18n.t(
                    "This survey has other surveys associated with it.\n Please delete all associated surveys, before you can delete this one."
                ),
            });
        } else {
            deleteSurvey(survey.id, survey.assignedOrgUnit.id, survey.astGuideline);
        }
    };

    const deleteSurvey = (surveyId: Id, orgUnitId: Id, astGuidelineType?: ASTGUIDELINE_TYPES) => {
        setLoading(true);

        if (formType === "PPSWardRegister" || formType === "PPSPatientRegister")
            orgUnitId = currentHospitalForm?.orgUnitId ?? "";
        compositionRoot.surveys.deleteSurvey
            .execute(formType, orgUnitId, surveyId, astGuidelineType)
            .run(
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
