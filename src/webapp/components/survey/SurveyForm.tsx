import React, { useEffect } from "react";
import { Button, Typography, withStyles } from "@material-ui/core";
import i18n from "@eyeseetea/d2-ui-components/locales";
import { useSurveyForm } from "./hook/useSurveyForm";
import { red300 } from "material-ui/styles/colors";
import { Id } from "../../../domain/entities/Ref";
import { Question } from "../../../domain/entities/Questionnaire";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { ContentLoader } from "../content-loader/ContentLoader";
import { useSaveSurvey } from "./hook/useSaveSurvey";
import styled from "styled-components";
import { getSurveyDisplayName } from "../../../domain/utils/PPSProgramsHelper";
import { SurveyFormOUSelector } from "./SurveyFormOUSelector";
import { SurveySection } from "./SurveySection";

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

    const {
        questionnaire,
        setQuestionnaire,
        loading,
        setLoading,
        currentOrgUnit,
        setCurrentOrgUnit,
        error,
        addNew,
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
    }, [error, saveCompleteState, snackbar, props]);

    const saveSurveyForm = () => {
        setLoading(true);
        //TO DO : User permission check for saving a Survey Form
        if (questionnaire) {
            saveSurvey(questionnaire);
        }
    };

    const updateQuestion = (question: Question) => {
        setQuestionnaire(questionnaire => {
            const stageToBeUpdated = questionnaire?.stages.find(stage =>
                stage.sections?.find(sec => sec.questions?.find(q => q.id === question?.id))
            );
            if (stageToBeUpdated) {
                const sectionToBeUpdated = stageToBeUpdated.sections.find(section =>
                    section.questions.find(q => q.id === question?.id)
                );
                if (sectionToBeUpdated) {
                    const questionToBeUpdated = sectionToBeUpdated.questions.find(
                        q => q.id === question.id
                    );
                    if (questionToBeUpdated) questionToBeUpdated.value = question.value;
                }
            } else {
                //Stage not found, entity could be updated.
                const questionToBeUpdated = questionnaire?.entity?.questions.find(
                    q => q.id === question.id
                );
                if (questionToBeUpdated) questionToBeUpdated.value = question.value;
            }
            return questionnaire;
        });
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
                    <SurveySection
                        title={questionnaire.entity.title}
                        updateQuestion={updateQuestion}
                        questions={questionnaire.entity.questions}
                    />
                )}

                {questionnaire?.stages.map(stage => {
                    if (!stage.isVisible) return null;

                    return (
                        <div key={stage.code}>
                            <p> {`Stage : ${stage.title}`}</p>
                            {stage.sections.map(section => {
                                if (!section.isVisible) return null;

                                return (
                                    <SurveySection
                                        key={section.code}
                                        title={section.title}
                                        updateQuestion={updateQuestion}
                                        questions={section.questions}
                                        showAddnew={section.showAddnew}
                                        addNewClick={() => addNew(section)}
                                    />
                                );
                            })}
                        </div>
                    );
                })}
            </ContentLoader>
            <PageFooter>
                <CancelButton variant="outlined" onClick={onCancel}>
                    {i18n.t("Cancel")}
                </CancelButton>

                <Button variant="contained" color="primary" onClick={saveSurveyForm}>
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
