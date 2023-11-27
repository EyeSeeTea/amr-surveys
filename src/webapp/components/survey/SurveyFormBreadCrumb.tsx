import { Button } from "@material-ui/core";
import { NavLink } from "react-router-dom";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import i18n from "@eyeseetea/feedback-component/locales";
import { Id } from "../../../domain/entities/Ref";
import { StyledBreadCrumbChild, StyledBreadCrumbs } from "../survey-list/SurveyListBreadCrumb";
import { useAppContext } from "../../contexts/app-context";
import { useCurrentModule } from "../../contexts/current-module-context";
import { getUserAccess } from "../../../domain/utils/menuHelper";

export interface SurveyFormBreadCrumbProps {
    formType: SURVEY_FORM_TYPES;
    id: Id;
}

export const SurveyFormBreadCrumb: React.FC<SurveyFormBreadCrumbProps> = ({ formType, id }) => {
    const {
        currentPPSSurveyForm,
        currentCountryQuestionnaire,
        currentHospitalForm,
        currentWardRegister,
    } = useCurrentSurveys();
    const { currentUser } = useAppContext();
    const { currentModule } = useCurrentModule();

    const isAdmin = currentModule
        ? getUserAccess(currentModule, currentUser.userGroups).hasAdminAccess
        : false;
    return (
        <StyledBreadCrumbs aria-label="breadcrumb" separator={<ChevronRightIcon />}>
            {isAdmin && (
                <Button component={NavLink} to={`/surveys/PPSSurveyForm`} exact={true}>
                    <span>{i18n.t("PPS Surveys")}</span>
                </Button>
            )}

            {isAdmin && (
                <StyledBreadCrumbChild>
                    {currentPPSSurveyForm ? (
                        <Button
                            component={NavLink}
                            to={`/survey/PPSSurveyForm/${currentPPSSurveyForm.id}`}
                            exact={true}
                        >
                            <span>{currentPPSSurveyForm.name}</span>
                        </Button>
                    ) : (
                        <Button>
                            <span>{i18n.t("New Survey")}</span>
                        </Button>
                    )}
                </StyledBreadCrumbChild>
            )}

            {isAdmin &&
                currentPPSSurveyForm?.surveyType !== "HOSP" &&
                (formType === "PPSCountryQuestionnaire" ||
                    formType === "PPSHospitalForm" ||
                    formType === "PPSWardRegister" ||
                    formType === "PPSPatientRegister") && (
                    <StyledBreadCrumbChild>
                        <Button
                            component={NavLink}
                            to={`/surveys/PPSCountryQuestionnaire`}
                            exact={true}
                        >
                            <span>{i18n.t("Country Questionnaires")}</span>
                        </Button>
                        <ChevronRightIcon />
                        {currentCountryQuestionnaire ? (
                            <Button
                                component={NavLink}
                                to={`/survey/PPSCountryQuestionnaire/${currentCountryQuestionnaire.id}`}
                                exact={true}
                            >
                                <span>{currentCountryQuestionnaire.name}</span>
                            </Button>
                        ) : (
                            <Button>
                                <span>{i18n.t("New Survey")}</span>
                            </Button>
                        )}
                    </StyledBreadCrumbChild>
                )}
            {(formType === "PPSHospitalForm" ||
                formType === "PPSWardRegister" ||
                formType === "PPSPatientRegister") && (
                <StyledBreadCrumbChild>
                    <Button component={NavLink} to={`/surveys/PPSHospitalForm`} exact={true}>
                        <span>{i18n.t("Hospital Forms")}</span>
                    </Button>
                    <ChevronRightIcon />
                    {currentHospitalForm ? (
                        <Button
                            component={NavLink}
                            to={`/survey/PPSHospitalForm/${currentHospitalForm.id}`}
                            exact={true}
                        >
                            <span>{currentHospitalForm.name}</span>
                        </Button>
                    ) : (
                        <Button>
                            <span>{i18n.t("New Survey")}</span>
                        </Button>
                    )}
                </StyledBreadCrumbChild>
            )}
            {(formType === "PPSWardRegister" || formType === "PPSPatientRegister") && (
                <StyledBreadCrumbChild>
                    <Button component={NavLink} to={`/surveys/PPSWardRegister`} exact={true}>
                        <span>{i18n.t("Ward Registers")}</span>
                    </Button>
                    <ChevronRightIcon />
                    {currentWardRegister ? (
                        <Button
                            component={NavLink}
                            to={`/survey/PPSWardRegister/${currentWardRegister.id}`}
                            exact={true}
                        >
                            <span>{currentWardRegister.name}</span>
                        </Button>
                    ) : (
                        <Button>
                            <span>{i18n.t("New Survey")}</span>
                        </Button>
                    )}
                </StyledBreadCrumbChild>
            )}
            {formType === "PPSPatientRegister" && (
                <StyledBreadCrumbChild>
                    <Button component={NavLink} to={`/surveys/PPSPatientRegister`} exact={true}>
                        <span>{i18n.t("Patient Registers")}</span>
                    </Button>
                    <ChevronRightIcon />
                    {id ? (
                        <Button>
                            <span>{id}</span>
                        </Button>
                    ) : (
                        <Button>
                            <span>{i18n.t("New Survey")}</span>
                        </Button>
                    )}
                </StyledBreadCrumbChild>
            )}
        </StyledBreadCrumbs>
    );
};
