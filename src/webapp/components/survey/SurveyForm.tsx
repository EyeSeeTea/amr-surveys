import React, { useEffect, useState } from "react";
import { Button, withStyles, Typography } from "@material-ui/core";
import i18n from "@eyeseetea/d2-ui-components/locales";
import { useSurveyForm } from "./hook/useSurveyForm";
import { red300 } from "material-ui/styles/colors";
import { Id } from "../../../domain/entities/Ref";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { ContentLoader } from "../content-loader/ContentLoader";
import { useSaveSurvey } from "./hook/useSaveSurvey";
import styled from "styled-components";
import { getSurveyDisplayName } from "../../../domain/utils/PPSProgramsHelper";
import { SurveyFormOUSelector } from "./SurveyFormOUSelector";
import { SurveySection } from "./SurveySection";
import { useHistory } from "react-router-dom";
import useReadOnlyAccess from "./hook/useReadOnlyAccess";
import { GridSection } from "./GridSection";
import _c from "../../../domain/entities/generic/Collection";
import { TableSection } from "./TableSection";
import { QuestionOption } from "../../../domain/entities/Questionnaire/QuestionnaireQuestion";

export interface SurveyFormProps {
    hideForm: () => void;
    currentSurveyId?: Id;
    formType: SURVEY_FORM_TYPES;
}

const CancelButton = withStyles(() => ({
    root: {
        color: "white",
        backgroundColor: "#bd1818",
        "&:hover": {
            backgroundColor: red300,
        },
        marginRight: "10px",
    },
}))(Button);

export const SurveyForm: React.FC<SurveyFormProps> = props => {
    const snackbar = useSnackbar();
    const history = useHistory();
    const { hasReadOnlyAccess } = useReadOnlyAccess();

    const {
        questionnaire,
        loading,
        setLoading,
        currentOrgUnit,
        setCurrentOrgUnit,
        error,
        shouldDisableSave,
        updateQuestion,
        addProgramStage,
        removeProgramStage,
    } = useSurveyForm(props.formType, props.currentSurveyId);

    const { saveCompleteState, saveSurvey, resetSaveActionOutcome } = useSaveSurvey(
        props.formType,
        currentOrgUnit?.orgUnitId ?? "",
        props.currentSurveyId
    );

    const [treatmentOptions, setTreatmentOptions] = useState<QuestionOption[]>();
    const [indicationOptions, setIndicationOptions] = useState<QuestionOption[]>();

    useEffect(() => {
        if (saveCompleteState && saveCompleteState.status === "success") {
            snackbar.info(saveCompleteState.message);
            if (props.hideForm) props.hideForm();
        }

        if (saveCompleteState && saveCompleteState.status === "error") {
            snackbar.error(saveCompleteState.message);
            if (props.hideForm) props.hideForm();
        }

        if (saveCompleteState && saveCompleteState.status === "intermediate-success") {
            snackbar.info(saveCompleteState.message);
            resetSaveActionOutcome();
        }
        if (props.formType === "PPSPatientRegister" && questionnaire && questionnaire.stages) {
            const existingTreatments = _c(
                questionnaire.stages
                    .filter(stage => stage.code === "rayB0NQMmwx")
                    .flatMap(stage => stage.instanceId)
            )
                .compact()
                .value();

            const treatmentLinkOptions: QuestionOption[] = existingTreatments.map(treatment => {
                return {
                    id: treatment,
                    name: treatment,
                    code: treatment,
                };
            });
            setTreatmentOptions(treatmentLinkOptions);

            const existingIndications = _c(
                questionnaire.stages
                    .filter(stage => stage.code === "tLOW37yZuB9")
                    .flatMap(stage => stage.instanceId)
            )
                .compact()
                .value();

            const indicationLinkOptions: QuestionOption[] = existingIndications.map(indication => {
                return {
                    id: indication,
                    name: indication,
                    code: indication,
                };
            });
            setIndicationOptions(indicationLinkOptions);
        }

        //If error fetching survey, redirect to homepage.
        if (error) {
            // history.push(`/`);
        }
    }, [error, saveCompleteState, snackbar, history, props, questionnaire, resetSaveActionOutcome]);

    const saveSurveyForm = () => {
        setLoading(true);
        //TO DO : User permission check for saving a Survey Form
        if (questionnaire) {
            saveSurvey(questionnaire, false);
        }
    };
    const saveSurveyFormWithoutRedirect = () => {
        //TO DO : User permission check for saving a Survey Form
        if (questionnaire) {
            saveSurvey(questionnaire, true);
        }
    };

    const onCancel = () => {
        props.hideForm();
    };

    return (
        <div>
            <ContentLoader loading={loading} error={error} showErrorAsSnackbar={true}>
                <Title variant="h5">{i18n.t(getSurveyDisplayName(props.formType) || "")}</Title>
                <SurveyFormOUSelector
                    formType={props.formType}
                    currentOrgUnit={currentOrgUnit}
                    setCurrentOrgUnit={setCurrentOrgUnit}
                    currentSurveyId={props.currentSurveyId}
                />

                {questionnaire?.entity && (
                    <PaddedDiv>
                        <Typography>{i18n.t(`Stage - Profile`)}</Typography>
                        <SurveySection
                            title={questionnaire.entity.title}
                            updateQuestion={updateQuestion}
                            questions={questionnaire.entity.questions}
                            viewOnly={hasReadOnlyAccess}
                        />
                    </PaddedDiv>
                )}
                {questionnaire?.stages?.map(stage => {
                    if (!stage?.isVisible) return null;

                    return (
                        <PaddedDiv key={stage.id}>
                            <Typography>{i18n.t(`Stage - ${stage.title}`)}</Typography>
                            {stage.sections.map(section => {
                                if (!section.isVisible || section.isAntibioticSection) return null;

                                if (section.isSpeciesSection)
                                    return (
                                        <GridSection
                                            speciesSection={section}
                                            antibioticStage={stage}
                                            updateQuestion={question =>
                                                updateQuestion(question, stage.id)
                                            }
                                            viewOnly={hasReadOnlyAccess}
                                        />
                                    );
                                if (section.isAntibioticTreatmentHospitalEpisodeSection)
                                    return (
                                        <TableSection
                                            section={section}
                                            updateQuestion={question =>
                                                updateQuestion(question, stage.id)
                                            }
                                            viewOnly={hasReadOnlyAccess}
                                        />
                                    );

                                return (
                                    <SurveySection
                                        key={section.code}
                                        title={section.title}
                                        updateQuestion={question =>
                                            updateQuestion(question, stage.id)
                                        }
                                        questions={section.questions}
                                        viewOnly={hasReadOnlyAccess}
                                        treatmentOptions={treatmentOptions}
                                        // selectedTreatmentOption={selectedTreatmentOption}
                                        indicationOptions={indicationOptions}
                                        // selectedIndicationOption={selectedIndicationOption}
                                    />
                                );
                            })}
                            {stage.repeatable && stage.code === "tLOW37yZuB9" && (
                                <RightAlignedDiv>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={saveSurveyFormWithoutRedirect}
                                        disabled={shouldDisableSave}
                                    >
                                        {i18n.t("Save Indication")}
                                    </Button>
                                </RightAlignedDiv>
                            )}
                            {stage.repeatable && stage.code === "rayB0NQMmwx" && (
                                <RightAlignedDiv>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={saveSurveyFormWithoutRedirect}
                                        disabled={shouldDisableSave}
                                    >
                                        {i18n.t("Save Treatment")}
                                    </Button>
                                </RightAlignedDiv>
                            )}
                            {stage.repeatable && (
                                <RightAlignedDiv>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => addProgramStage(stage.code)}
                                    >
                                        {i18n.t(`Add Another ${stage.title}`)}
                                    </Button>
                                    {stage.isAddedByUser && (
                                        <CancelButton
                                            variant="outlined"
                                            onClick={() => removeProgramStage(stage.id)}
                                        >
                                            {i18n.t(`Remove ${stage.title}`)}
                                        </CancelButton>
                                    )}
                                </RightAlignedDiv>
                            )}
                        </PaddedDiv>
                    );
                })}
            </ContentLoader>
            <PageFooter>
                <CancelButton variant="outlined" onClick={onCancel}>
                    {i18n.t("Cancel")}
                </CancelButton>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={saveSurveyForm}
                    disabled={shouldDisableSave}
                >
                    {i18n.t("Save")}
                </Button>
            </PageFooter>
        </div>
    );
};

const PageFooter = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    padding: 20px;
`;

const Title = styled(Typography)`
    margin-block-end: 10px;
`;

const PaddedDiv = styled.div`
    padding: 15px 0;
`;

const RightAlignedDiv = styled.div`
    display: flex;
    justify-content: end;
    padding: 10px;
    gap: 5px;
`;
