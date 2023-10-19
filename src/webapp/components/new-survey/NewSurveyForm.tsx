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
import { useNewSurveyForm } from "./hook/useNewSurveyForm";
import { red300 } from "material-ui/styles/colors";
import { Id } from "../../../domain/entities/Ref";
import { Question } from "../../../domain/entities/Questionnaire";
import { QuestionWidget } from "../survey-questions/QuestionWidget";

export interface NewSurveyFormProps {
    hideForm: () => void;
    eventId?: Id;
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

export const NewSurveyForm: React.FC<NewSurveyFormProps> = props => {
    const classes = useStyles();
    const formClasses = useFormStyles();

    const { questionnaire, setQuestionnaire, loading } = useNewSurveyForm(props.eventId);

    // const saveQuestionnaire = () => {
    //     console.debug("Save event to DHIS");
    //     // setLoading(true);
    //     // if (
    //     //     questionnaire &&
    //     //     readAccessGroup.kind === "loaded" &&
    //     //     confidentialAccessGroup.kind === "loaded"
    //     // ) {
    //     //     const readAccessGroups: string[] = readAccessGroup.data.map(aag => {
    //     //         return aag.id;
    //     //     });
    //     //     const confidentialAccessGroups: string[] = confidentialAccessGroup.data.map(cag => {
    //     //         return cag.id;
    //     //     });
    //     //     compositionRoot.signals
    //     //         .importData(
    //     //             props.signalId,
    //     //             props.signalEventId,
    //     //             questionnaire,
    //     //             {
    //     //                 id: currentOrgUnitAccess.orgUnitId,
    //     //                 name: currentOrgUnitAccess.orgUnitName,
    //     //                 path: currentOrgUnitAccess.orgUnitPath,
    //     //             },
    //     //             { id: currentModuleAccess.moduleId, name: currentModuleAccess.moduleName },
    //     //             "Save",
    //     //             readAccessGroups,
    //     //             confidentialAccessGroups
    //     //         )
    //     //         .run(
    //     //             () => {
    //     //                 snackbar.info("Submission Success!");
    //     //                 setLoading(false);
    //     //                 if (props.hideForm) props.hideForm();
    //     //             },
    //     //             () => {
    //     //                 snackbar.error(
    //     //                     "Submission Failed! You do not have the necessary permissions, please contact your administrator"
    //     //                 );
    //     //                 setLoading(false);
    //     //                 if (props.hideForm) props.hideForm();
    //     //             }
    //     //         );
    //     // }
    // };

    const publishQuestionnaire = () => {
        console.debug("Publish Questionnaire");
        // setLoading(true);
        // if (
        //     questionnaire &&
        //     readAccessGroup.kind === "loaded" &&
        //     confidentialAccessGroup.kind === "loaded"
        // ) {
        //     const readAccessGroups = readAccessGroup.data.map(aag => {
        //         return aag.id;
        //     });
        //     const confidentialAccessGroups = confidentialAccessGroup.data.map(cag => {
        //         return cag.id;
        //     });
        //     compositionRoot.signals
        //         .importData(
        //             props.signalId,
        //             props.signalEventId,
        //             questionnaire,
        //             {
        //                 id: currentOrgUnitAccess.orgUnitId,
        //                 name: currentOrgUnitAccess.orgUnitName,
        //                 path: currentOrgUnitAccess.orgUnitPath,
        //             },
        //             { id: currentModuleAccess.moduleId, name: currentModuleAccess.moduleName },
        //             "Publish",
        //             readAccessGroups,
        //             confidentialAccessGroups
        //         )
        //         .run(
        //             () => {
        //                 snackbar.info("Submission Success!");
        //                 setLoading(false);
        //                 if (props.hideForm) props.hideForm();
        //             },
        //             () => {
        //                 snackbar.error(
        //                     "Submission Failed! You do not have the necessary permissions, please contact your administrator"
        //                 );
        //                 setLoading(false);
        //                 if (props.hideForm) props.hideForm();
        //             }
        //         );
        // }
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
            <Backdrop open={loading} style={{ color: "#fff", zIndex: 1 }}>
                <StyledLoaderContainer>
                    <CircularProgress color="inherit" size={50} />
                    {/* <Typography variant="h6">{i18n.t("Importing data and applying validation rules")}</Typography>
                    <Typography variant="h5">
                        {i18n.t("This might take several minutes, do not refresh the page or press back.")}
                    </Typography> */}
                </StyledLoaderContainer>
            </Backdrop>

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
                                                        disabled={false}
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

                <Button variant="contained" color="primary" onClick={publishQuestionnaire}>
                    {i18n.t("OK")}
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
