import { useCallback, useEffect, useState } from "react";
import {
    isPPSIndicationLinkQuestion,
    isPPSTreatmentLinkQuestion,
    PPSIndicationLinkQuestion,
    QuestionOption,
} from "../../../../domain/entities/Questionnaire/QuestionnaireQuestion";
import {
    Questionnaire,
    QuestionnaireStage,
} from "../../../../domain/entities/Questionnaire/Questionnaire";
import { SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import _c from "../../../../domain/entities/generic/Collection";
import {
    PPS_PATIENT_TRACKER_INDICATION_STAGE_ID,
    PPS_PATIENT_TRACKER_TREATMENT_STAGE_ID,
} from "../../../../data/utils/surveyFormMappers";
import { Id } from "../../../../domain/entities/Ref";
import { useSnackbar } from "@eyeseetea/d2-ui-components";

type AutoLinkStatus = {
    updatedQuestionnaire: Questionnaire;
    error: boolean;
};

export const useTreatmentIndicationLink = (
    formType: SURVEY_FORM_TYPES,
    questionnaire: Questionnaire | undefined
) => {
    const [treatmentOptions, setTreatmentOptions] = useState<QuestionOption[]>();
    const [indicationOptions, setIndicationOptions] = useState<QuestionOption[]>();
    const snackbar = useSnackbar();

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

    const mapIndicationsToTreatments = useCallback((indicationStages: QuestionnaireStage[]) => {
        //Get a map of indications to treatments, selected by user.
        const indicationTreatmentMap: { indicationId: Id; treatmentIds: Id[] }[] = _c(
            indicationStages.map(indicationStage => {
                if (!indicationStage.sections[0]) return undefined;
                if (!indicationStage.instanceId) return undefined;
                const linkedTreatments = indicationStage.sections[0].questions.filter(
                    q => isPPSTreatmentLinkQuestion(q) && q.value
                );

                return {
                    indicationId: indicationStage.instanceId,
                    treatmentIds: _c(linkedTreatments.map(q => q.value?.toString()))
                        .compact()
                        .value(),
                };
            })
        )
            .compact()
            .value();

        //Convert to a map of treatments to indications, to be autopopulated
        const treatmentIndicationMap = indicationTreatmentMap.reduce(
            (map, { indicationId, treatmentIds }) => {
                treatmentIds.forEach(treatmentId => {
                    map.set(treatmentId, [...(map.get(treatmentId) || []), indicationId]);
                });
                return map;
            },
            new Map<Id, Id[]>()
        );

        return treatmentIndicationMap;
    }, []);
    const autoUpdateIndicationLinks = useCallback(
        (currentQuestionnaire: Questionnaire): AutoLinkStatus => {
            const indicationStages = currentQuestionnaire.stages.filter(
                stage => stage.code === PPS_PATIENT_TRACKER_INDICATION_STAGE_ID
            );

            const treatmentStages = currentQuestionnaire.stages.filter(
                stage => stage.code === PPS_PATIENT_TRACKER_TREATMENT_STAGE_ID
            );

            const treatmentIndicationMap = mapIndicationsToTreatments(indicationStages);

            //One treatment cannot be linked to more than 5 indications
            const linkError = Array.from(treatmentIndicationMap.entries()).some(
                ([treatment, indications]) => {
                    if (indications.length > 5) {
                        snackbar.error(
                            `The treatment : ${treatment} can only be linked to a maximum of 5 indications : `
                        );
                        return true;
                    }
                    return false;
                }
            );

            if (linkError) return { updatedQuestionnaire: currentQuestionnaire, error: true };

            const updatedTreatmentStages: QuestionnaireStage[] = treatmentStages.map(
                treatmentStage => {
                    if (!treatmentStage.sections[0]) return treatmentStage;
                    if (!treatmentStage.instanceId) return treatmentStage;

                    const indicationLinkQuestions: PPSIndicationLinkQuestion[] =
                        treatmentStage.sections[0].questions.filter(isPPSIndicationLinkQuestion);
                    const otherQuestions = treatmentStage.sections[0].questions.filter(
                        q => !isPPSIndicationLinkQuestion(q)
                    );
                    if (!indicationLinkQuestions) return treatmentStage;

                    const linkedIndications = treatmentIndicationMap.get(treatmentStage.instanceId);
                    const updatedIndicationLinks: PPSIndicationLinkQuestion[] =
                        indicationLinkQuestions.map((q, index) => {
                            return {
                                ...q,
                                value: linkedIndications ? linkedIndications[index] : undefined,
                            };
                        });

                    const updatedStage: QuestionnaireStage = {
                        ...treatmentStage,
                        sections: [
                            {
                                ...treatmentStage.sections[0],
                                questions: [...otherQuestions, ...updatedIndicationLinks],
                            },
                        ],
                    };

                    return updatedStage;
                }
            );

            const otherStages = currentQuestionnaire.stages.filter(
                stage => stage.code !== PPS_PATIENT_TRACKER_TREATMENT_STAGE_ID
            );

            const updatedQuestionnaire: Questionnaire = Questionnaire.updateQuestionnaireStages(
                currentQuestionnaire,
                [...otherStages, ...updatedTreatmentStages]
            );

            return { updatedQuestionnaire: updatedQuestionnaire, error: false };
        },
        [mapIndicationsToTreatments, snackbar]
    );

    return { treatmentOptions, indicationOptions, removeLinkedStage, autoUpdateIndicationLinks };
};
