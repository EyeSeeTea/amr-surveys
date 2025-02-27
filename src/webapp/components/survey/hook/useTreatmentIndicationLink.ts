import { useCallback, useEffect, useState } from "react";
import { QuestionOption } from "../../../../domain/entities/Questionnaire/QuestionnaireQuestion";
import { Questionnaire } from "../../../../domain/entities/Questionnaire/Questionnaire";
import { SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import _c from "../../../../domain/entities/generic/Collection";
import {
    PPS_PATIENT_TRACKER_INDICATION_STAGE_ID,
    PPS_PATIENT_TRACKER_TREATMENT_STAGE_ID,
} from "../../../../data/utils/surveyFormMappers";

export const useTreatmentIndicationLink = (
    formType: SURVEY_FORM_TYPES,
    questionnaire: Questionnaire | undefined
) => {
    const [treatmentOptions, setTreatmentOptions] = useState<QuestionOption[]>();
    const [indicationOptions, setIndicationOptions] = useState<QuestionOption[]>();

    useEffect(() => {
        if (formType === "PPSPatientRegister" && questionnaire && questionnaire.stages) {
            const existingTreatments = _c(
                questionnaire.stages.filter(
                    stage =>
                        stage.code === PPS_PATIENT_TRACKER_TREATMENT_STAGE_ID && stage.instanceId
                )
            )
                .compact()
                .value();

            const treatmentLinkOptions: QuestionOption[] = existingTreatments.map(treatment => {
                return {
                    id: treatment.instanceId ?? "",
                    name: `${treatment.subTitle}`,
                    code: treatment.code,
                };
            });
            setTreatmentOptions(treatmentLinkOptions);

            const existingIndications = _c(
                questionnaire.stages.filter(
                    stage =>
                        stage.code === PPS_PATIENT_TRACKER_INDICATION_STAGE_ID && stage.instanceId
                )
            )
                .compact()
                .value();

            const indicationLinkOptions: QuestionOption[] = existingIndications.map(indication => {
                return {
                    id: indication.instanceId ?? "",
                    name: `${indication.subTitle}`,
                    code: indication.code,
                };
            });
            setIndicationOptions(indicationLinkOptions);
        }
    }, [formType, questionnaire]);

    const removeLinkedStage = useCallback((stageCode: string) => {
        if (stageCode === PPS_PATIENT_TRACKER_TREATMENT_STAGE_ID) {
            setTreatmentOptions(prevTreatmeantOptions => {
                return prevTreatmeantOptions?.filter(option => option.code !== stageCode);
            });
        } else if (stageCode === PPS_PATIENT_TRACKER_INDICATION_STAGE_ID) {
            setIndicationOptions(prevIndicationOptions => {
                return prevIndicationOptions?.filter(option => option.code !== stageCode);
            });
        }
    }, []);

    return { treatmentOptions, indicationOptions, removeLinkedStage };
};
