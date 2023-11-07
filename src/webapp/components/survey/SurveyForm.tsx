import React, { useEffect } from "react";
import { Button, makeStyles, Typography, withStyles } from "@material-ui/core";
// @ts-ignore
import {
    // @ts-ignore
    DataTable,
    // @ts-ignore
    TableHead,
    // @ts-ignore
    DataTableRow,
    // @ts-ignore
    DataTableColumnHeader,
    // @ts-ignore
    DataTableCell,
    // @ts-ignore
    TableBody,
} from "@dhis2/ui";
import i18n from "@eyeseetea/d2-ui-components/locales";
import styled from "styled-components";
import { useSurveyForm } from "./hook/useSurveyForm";
import { red300 } from "material-ui/styles/colors";
import { Id } from "../../../domain/entities/Ref";
import { Question } from "../../../domain/entities/Questionnaire";
import { QuestionWidget } from "../survey-questions/QuestionWidget";
import { useCurrentOrgUnitContext } from "../../contexts/current-org-unit-context/current-orgUnit-context";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { useSaveSurvey } from "./hook/useSaveSurvey";
import { ContentLoader } from "../content-loader/ContentLoader";

export interface SurveyFormProps {
    hideForm: () => void;
    surveyId?: Id;
    formType: SURVEY_FORM_TYPES;
    parentSurveyId?: Id;
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
    const { currentOrgUnitAccess } = useCurrentOrgUnitContext();
    const classes = useStyles();
    const formClasses = useFormStyles();
    const snackbar = useSnackbar();
    const { questionnaire, setQuestionnaire, loading, setLoading, error } = useSurveyForm(
        props.formType,
        props.surveyId,
        props.parentSurveyId
    );
    const { saveCompleteState, saveSurvey } = useSaveSurvey(
        props.formType,
        currentOrgUnitAccess.orgUnitId,
        props.surveyId
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
            const sectionToBeUpdated = questionnaire?.sections.filter(sec =>
                sec.questions.find(q => q.id === question?.id)
            );
            if (sectionToBeUpdated) {
                const questionToBeUpdated = sectionToBeUpdated[0]?.questions.filter(
                    q => q.id === question.id
                );
                if (questionToBeUpdated && questionToBeUpdated[0])
                    questionToBeUpdated[0].value = question.value;
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
                <Typography variant="h5">{i18n.t(questionnaire?.name || "")}</Typography>

                {questionnaire?.sections.map(section => {
                    if (!section.isVisible) return null;

                    return (
                        <div key={section.title} className={classes.wrapper}>
                            <DataTable>
                                <TableHead>
                                    <DataTableRow>
                                        <DataTableColumnHeader colSpan="2">
                                            <span className={classes.header}>{section.title}</span>
                                        </DataTableColumnHeader>
                                    </DataTableRow>
                                </TableHead>

                                <TableBody>
                                    {section.questions.map(question => (
                                        <DataTableRow key={question.id}>
                                            <DataTableCell width="60%">
                                                <span>{question.text}</span>
                                            </DataTableCell>

                                            <DataTableCell>
                                                <div className={formClasses.valueWrapper}>
                                                    <div className={formClasses.valueInput}>
                                                        <QuestionWidget
                                                            onChange={updateQuestion}
                                                            question={question}
                                                            disabled={
                                                                question.disabled ? true : false
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </DataTableCell>
                                        </DataTableRow>
                                    ))}
                                </TableBody>
                            </DataTable>
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

const useFormStyles = makeStyles({
    valueInput: { flexGrow: 1 },
    valueWrapper: { display: "flex" },
});

export const useStyles = makeStyles({
    wrapper: { margin: 10 },
    header: { fontWeight: "bold" as const },
    center: { display: "table", margin: "0 auto" },
});

const PageFooter = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    padding: 20px;
`;
