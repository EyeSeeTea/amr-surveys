import { useAppContext } from "../../../contexts/app-context";

import { SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import { Id } from "../../../../domain/entities/Ref";
import { useCallback, useState } from "react";
import i18n from "@eyeseetea/feedback-component/locales";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";
import { ActionOutcome } from "../../../../domain/entities/generic/ActionOutcome";
import { Questionnaire } from "../../../../domain/entities/Questionnaire/Questionnaire";
import { useHistory } from "react-router-dom";

export function useSaveSurvey(formType: SURVEY_FORM_TYPES, orgUnitId: Id, surveyId?: Id) {
    const { compositionRoot } = useAppContext();
    const history = useHistory();
    const [saveCompleteState, setSaveCompleteState] = useState<ActionOutcome>();
    const { currentHospitalForm, currentFacilityLevelForm } = useCurrentSurveys();

    const getOrgUnitByFormType = (originalOrgUnitId: Id) => {
        switch (formType) {
            case "PPSWardRegister":
            case "PPSPatientRegister":
                return currentHospitalForm?.orgUnitId ?? "";
            case "PrevalenceCaseReportForm":
            case "PrevalenceSampleShipTrackForm":
            case "PrevalenceCentralRefLabForm":
            case "PrevalencePathogenIsolatesLog":
            case "PrevalenceSupranationalRefLabForm":
            case "PrevalenceD28FollowUp":
            case "PrevalenceDischargeClinical":
            case "PrevalenceDischargeEconomic":
            case "PrevalenceCohortEnrolment":
                return currentFacilityLevelForm?.orgUnitId ?? "";
            default:
                return originalOrgUnitId;
        }
    };

    const saveSurvey = (questionnaire: Questionnaire, intermediate: boolean) => {
        const orgUnitByFormType = getOrgUnitByFormType(orgUnitId);

        compositionRoot.surveys.saveFormData
            .execute(formType, questionnaire, orgUnitByFormType, surveyId)
            .run(
                savedSurveyId => {
                    if (intermediate && formType === "PPSPatientRegister") {
                        if (!surveyId)
                            history.push({
                                pathname: `/survey/${formType}/${savedSurveyId}`,
                            });
                        else
                            setSaveCompleteState({
                                status: "intermediate-success",
                                message: i18n.t("Treatment/Indication Saved!"),
                            });
                    } else
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

    const resetSaveActionOutcome = useCallback(() => {
        setSaveCompleteState(undefined);
    }, [setSaveCompleteState]);

    return { saveCompleteState, saveSurvey, resetSaveActionOutcome };
}
