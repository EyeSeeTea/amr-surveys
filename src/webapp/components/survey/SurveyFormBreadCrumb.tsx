import { Button } from "@material-ui/core";
import { NavLink } from "react-router-dom";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import i18n from "@eyeseetea/feedback-component/locales";
import { Id } from "../../../domain/entities/Ref";
import { StyledBreadCrumbChild, StyledBreadCrumbs } from "../survey-list/SurveyListBreadCrumb";

export interface SurveyFormBreadCrumbProps {
    type: SURVEY_FORM_TYPES;
    id: Id;
}

export const SurveyFormBreadCrumb: React.FC<SurveyFormBreadCrumbProps> = ({ type, id }) => {
    const {
        currentPPSSurveyForm,
        currentCountryQuestionnaire,
        currentHospitalForm,
        currentWardRegister,
    } = useCurrentSurveys();
    return (
        <StyledBreadCrumbs aria-label="breadcrumb" separator={<ChevronRightIcon />}>
            <Button component={NavLink} to={`/surveys/PPSSurveyForm`} exact={true}>
                <span>{i18n.t("PPS Survey Forms")}</span>
            </Button>

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

            {(type === "PPSCountryQuestionnaire" ||
                type === "PPSHospitalForm" ||
                type === "PPSWardRegister" ||
                type === "PPSPatientRegister") && (
                <StyledBreadCrumbChild>
                    <Button
                        component={NavLink}
                        to={`/surveys/PPSCountryQuestionnaire`}
                        exact={true}
                    >
                        <span>{i18n.t("PPS Country Questionnaires")}</span>
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
            {(type === "PPSHospitalForm" ||
                type === "PPSWardRegister" ||
                type === "PPSPatientRegister") && (
                <StyledBreadCrumbChild>
                    <Button component={NavLink} to={`/surveys/PPSHospitalForm`} exact={true}>
                        <span>{i18n.t("PPS Hospital Forms")}</span>
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
            {(type === "PPSWardRegister" || type === "PPSPatientRegister") && (
                <StyledBreadCrumbChild>
                    <Button component={NavLink} to={`/surveys/PPSWardRegister`} exact={true}>
                        <span>{i18n.t("PPS Ward Registers")}</span>
                    </Button>
                    <ChevronRightIcon />
                    {currentWardRegister ? (
                        <Button
                            component={NavLink}
                            to={`/survey/PPSWardRegister/${currentWardRegister}`}
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
            {type === "PPSPatientRegister" && (
                <StyledBreadCrumbChild>
                    <Button component={NavLink} to={`/surveys/PPSPatientRegister`} exact={true}>
                        <span>{i18n.t("PPS Patient Registers")}</span>
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
