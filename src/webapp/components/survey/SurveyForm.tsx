import React from "react";
import {
    Backdrop,
    Button,
    CircularProgress,
    makeStyles,
    Typography,
    withStyles,
} from "@material-ui/core";
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
import { useAppContext } from "../../contexts/app-context";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { OrgUnitsSelector } from "@eyeseetea/d2-ui-components";

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
    const { compositionRoot } = useAppContext();
    const classes = useStyles();
    const formClasses = useFormStyles();
    const snackbar = useSnackbar();
    const { api, currentUser } = useAppContext();
    const {
        questionnaire,
        setQuestionnaire,
        loading,
        setLoading,
        currentOrgUnit,
        setCurrentOrgUnit,
    } = useSurveyForm(props.formType, props.surveyId, props.parentSurveyId);

    const saveSurvey = () => {
        setLoading(true);
        //TO DO : User permission check for saving a Survey Form
        if (questionnaire) {
            compositionRoot.surveys.saveFormData
                .execute(
                    props.formType,
                    questionnaire,
                    currentOrgUnit?.orgUnitId ?? "",
                    props.surveyId
                )
                .run(
                    () => {
                        snackbar.info("Submission Success!");
                        setLoading(false);
                        if (props.hideForm) props.hideForm();
                    },
                    () => {
                        snackbar.error(
                            "Submission Failed! You do not have the necessary permissions, please contact your administrator"
                        );
                        setLoading(false);
                        if (props.hideForm) props.hideForm();
                    }
                );
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

    const onOrgUnitChange = (orgUnitPaths: string[]) => {
        if (props.surveyId) {
            alert("Delete the Survey and create new one? Yes/No");
            return;
        }
        if (orgUnitPaths[0]) {
            const orgUnits = orgUnitPaths[0].split("/");
            const selectedCountry = orgUnits[orgUnits.length - 1];
            if (selectedCountry) {
                const currentOrgUnitAccess = currentUser.userOrgUnitsAccess.find(
                    ou => ou.orgUnitId === selectedCountry
                );
                if (currentOrgUnitAccess) {
                    setCurrentOrgUnit(currentOrgUnitAccess);
                }
            }
        }
    };

    return (
        <div>
            <Backdrop open={loading} style={{ color: "#fff", zIndex: 1 }}>
                <StyledLoaderContainer>
                    <CircularProgress color="inherit" size={50} />
                </StyledLoaderContainer>
            </Backdrop>

            <Typography variant="h5">{i18n.t(questionnaire?.name || "")}</Typography>

            {props.formType === "PPSCountryQuestionnaire" && (
                <OrgUnitsSelector
                    api={api}
                    fullWidth={false}
                    selected={[currentOrgUnit?.orgUnitPath]}
                    onChange={onOrgUnitChange}
                    singleSelection={true}
                    typeInput={"radio"}
                    hideMemberCount={false}
                    selectableLevels={[3]}
                    controls={{
                        filterByLevel: false,
                        filterByGroup: false,
                        filterByProgram: false,
                        selectAll: false,
                    }}
                />
            )}

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
                                                            question.id === "JHw6Hs0T2Lb" //TO DO : Set in domain based
                                                                ? true
                                                                : false
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

            <PageFooter>
                <CancelButton variant="outlined" onClick={onCancel}>
                    {i18n.t("Cancel")}
                </CancelButton>

                <Button variant="contained" color="primary" onClick={saveSurvey}>
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
export const StyledLoaderContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;
