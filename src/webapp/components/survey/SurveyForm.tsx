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
import { useSurveyForm } from "./hook/useSurveyForm";
import { red300 } from "material-ui/styles/colors";
import { Id } from "../../../domain/entities/Ref";
import { Question } from "../../../domain/entities/Questionnaire";
import { QuestionWidget } from "../survey-questions/QuestionWidget";
import { useAppContext } from "../../contexts/app-context";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { OrgUnitsSelector } from "@eyeseetea/d2-ui-components";
import { ContentLoader } from "../content-loader/ContentLoader";
import { useSaveSurvey } from "./hook/useSaveSurvey";
import styled from "styled-components";
import { GLOBAL_OU_ID } from "../../../domain/usecases/SaveFormDataUseCase";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { getParentOUIdFromPath } from "../../../domain/utils/PPSProgramsHelper";

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
        error,
    } = useSurveyForm(props.formType, props.currentSurveyId);

    const { saveCompleteState, saveSurvey } = useSaveSurvey(
        props.formType,
        currentOrgUnit?.orgUnitId ?? "",
        props.currentSurveyId
    );

    const { currentCountryQuestionnaire } = useCurrentSurveys();

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

    const onOrgUnitChange = (orgUnitPaths: string[]) => {
        if (props.currentSurveyId) {
            alert("Delete the Survey and create new one? Yes/No"); //TO DO : Replace with dialog after behaviour confirmation
            return;
        }
        if (orgUnitPaths[0]) {
            const orgUnits = orgUnitPaths[0].split("/");

            const selectedOU = orgUnits[orgUnits.length - 1];
            if (selectedOU) {
                if (props.formType === "PPSCountryQuestionnaire") {
                    const currentCountry = currentUser.userCountriesAccess.find(
                        ou => ou.orgUnitId === selectedOU
                    );
                    if (currentCountry) {
                        setCurrentOrgUnit(currentCountry);
                    }
                } else if (props.formType === "PPSHospitalForm") {
                    const currentHospital = currentUser.userHospitalsAccess.find(
                        hospital => hospital.orgUnitId === selectedOU
                    );
                    if (currentHospital) {
                        setCurrentOrgUnit(currentHospital);
                    }
                }
            }
        }
    };

    return (
        <div>
            <ContentLoader loading={loading} error={error} showErrorAsSnackbar={true}>
                <Typography variant="h5">{i18n.t(questionnaire?.name || "")}</Typography>

                {(props.formType === "PPSCountryQuestionnaire" ||
                    props.formType === "PPSHospitalForm") && (
                    <OrgUnitsSelector
                        api={api}
                        fullWidth={false}
                        selected={[currentOrgUnit?.orgUnitPath ? currentOrgUnit?.orgUnitPath : ""]}
                        initiallyExpanded={
                            currentOrgUnit?.orgUnitPath ? [currentOrgUnit?.orgUnitPath] : []
                        }
                        onChange={onOrgUnitChange}
                        singleSelection={true}
                        typeInput={"radio"}
                        hideMemberCount={false}
                        selectableLevels={props.formType === "PPSCountryQuestionnaire" ? [3] : [4]}
                        controls={{
                            filterByLevel: false,
                            filterByGroup: false,
                            filterByProgram: false,
                            selectAll: false,
                        }}
                        rootIds={
                            props.formType === "PPSHospitalForm"
                                ? currentCountryQuestionnaire?.orgUnitId
                                    ? [currentCountryQuestionnaire?.orgUnitId] //For non-admin user, currentCountryQuestionnaire wont be set. Get parent id from path
                                    : [getParentOUIdFromPath(currentOrgUnit?.orgUnitPath)]
                                : [GLOBAL_OU_ID]
                        }
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
