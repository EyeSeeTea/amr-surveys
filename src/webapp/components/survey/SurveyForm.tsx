import React, { useEffect } from "react";
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
import { Question, Code } from "../../../domain/entities/Questionnaire/QuestionnaireQuestion";
import { Questionnaire } from "../../../domain/entities/Questionnaire/Questionnaire";

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

    const {
        questionnaire,
        setQuestionnaire,
        loading,
        setLoading,
        currentOrgUnit,
        setCurrentOrgUnit,
        error,
        shouldDisableSave,
    } = useSurveyForm(props.formType, props.currentSurveyId);

    const { saveCompleteState, saveSurvey } = useSaveSurvey(
        props.formType,
        currentOrgUnit?.orgUnitId ?? "",
        props.currentSurveyId
    );

    useEffect(() => {
        if (saveCompleteState && saveCompleteState.status === "success") {
            snackbar.info(saveCompleteState.message);
            if (props.hideForm) props.hideForm();
        }

        if (saveCompleteState && saveCompleteState.status === "error") {
            snackbar.error(saveCompleteState.message);
            if (props.hideForm) props.hideForm();
        }

        //If error fetching survey, redirect to homepage.
        if (error) {
            history.push(`/`);
        }
    }, [error, saveCompleteState, snackbar, history, props]);

    const saveSurveyForm = () => {
        setLoading(true);
        //TO DO : User permission check for saving a Survey Form
        if (questionnaire) {
            saveSurvey(questionnaire);
        }
    };

    const updateQuestion = (question: Question, stageId?: string) => {
        if (questionnaire) {
            const updatedQuestionnaire = Questionnaire.updateQuestionnaire(
                questionnaire,
                question,
                stageId
            );
            setQuestionnaire(updatedQuestionnaire);
        }
    };

    const addProgramStage = (stageCode: Code) => {
        if (questionnaire) {
            const updatedQuestionnaire = Questionnaire.addProgramStage(questionnaire, stageCode);
            setQuestionnaire(updatedQuestionnaire);
        }
    };

    const removeProgramStage = (stageId: Id) => {
        if (questionnaire) {
            const updatedQuestionnaire = Questionnaire.removeProgramStage(questionnaire, stageId);
            setQuestionnaire(updatedQuestionnaire);
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
                        <Typography>Stage : Profile</Typography>
                        <SurveySection
                            title={questionnaire.entity.title}
                            updateQuestion={updateQuestion}
                            questions={questionnaire.entity.questions}
                        />
                    </PaddedDiv>
                )}
                {questionnaire?.stages?.map(stage => {
                    if (!stage?.isVisible) return null;

                    return (
                        <PaddedDiv key={stage.id}>
                            <Typography>Stage : {stage.title}</Typography>
                            {stage.repeatable && (
                                <RightAlignedDiv>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => addProgramStage(stage.code)}
                                    >
                                        Add Another {stage.title}
                                    </Button>
                                    {stage.isAddedByUser && (
                                        <CancelButton
                                            variant="outlined"
                                            onClick={() => removeProgramStage(stage.id)}
                                        >
                                            Remove {stage.title}
                                        </CancelButton>
                                    )}
                                </RightAlignedDiv>
                            )}

                            {stage.sections.map(section => {
                                if (!section.isVisible) return null;

                                return (
                                    <SurveySection
                                        key={section.code}
                                        title={section.title}
                                        updateQuestion={question =>
                                            updateQuestion(question, stage.id)
                                        }
                                        questions={section.questions}
                                    />
                                );
                            })}
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
