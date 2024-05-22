import { useAppContext } from "../../../contexts/app-context";

import { SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import { Id } from "../../../../domain/entities/Ref";
import { useState } from "react";
import i18n from "@eyeseetea/feedback-component/locales";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";
import { ActionOutcome } from "../../../../domain/entities/generic/ActionOutcome";
import { Questionnaire } from "../../../../domain/entities/Questionnaire/Questionnaire";

export function useSaveSurvey(formType: SURVEY_FORM_TYPES, orgUnitId: Id, surveyId?: Id) {
    const { compositionRoot } = useAppContext();
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
            case "PrevalenceDischarge":
            case "PrevalenceCohortEnrolment":
                return currentFacilityLevelForm?.orgUnitId ?? "";
            default:
                return originalOrgUnitId;
        }
    };

    const saveSurvey = (questionnaire: Questionnaire) => {
        const orgUnitByFormType = getOrgUnitByFormType(orgUnitId);

        compositionRoot.surveys.saveFormData
            .execute(formType, questionnaire, orgUnitByFormType, surveyId)
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
