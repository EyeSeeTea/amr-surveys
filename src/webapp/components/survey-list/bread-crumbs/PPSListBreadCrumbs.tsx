import { Breadcrumbs, Button } from "@material-ui/core";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";
import { palette } from "../../../pages/app/themes/dhis2.theme";
import { SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import i18n from "@eyeseetea/feedback-component/locales";
import { getUserAccess } from "../../../../domain/utils/menuHelper";
import { useAppContext } from "../../../contexts/app-context";
import { useCurrentModule } from "../../../contexts/current-module-context";

export interface PPSListBreadCrumbsProps {
    formType: SURVEY_FORM_TYPES;
}

export const PPSListBreadCrumbs: React.FC<PPSListBreadCrumbsProps> = ({ formType }) => {
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
                    <span> {i18n.t("PPS Surveys")}</span>
                </Button>
            )}
            {isAdmin &&
                (formType === "PPSCountryQuestionnaire" ||
                    formType === "PPSHospitalForm" ||
                    formType === "PPSWardRegister" ||
                    formType === "PPSPatientRegister") && (
                    <StyledBreadCrumbChild>
                        <Button
                            component={NavLink}
                            to={`/survey/PPSSurveyForm/${currentPPSSurveyForm?.id}`}
                            exact={true}
                        >
                            <span>{currentPPSSurveyForm?.name}</span>
                        </Button>
                        {currentPPSSurveyForm?.surveyType !== "HOSP" && (
                            <>
                                <ChevronRightIcon />
                                <Button
                                    component={NavLink}
                                    to={`/surveys/PPSCountryQuestionnaire`}
                                    exact={true}
                                >
                                    <span>{i18n.t("Country")}</span>
                                </Button>
                            </>
                        )}
                    </StyledBreadCrumbChild>
                )}
            {(formType === "PPSHospitalForm" ||
                formType === "PPSWardRegister" ||
                formType === "PPSPatientRegister") && (
                <StyledBreadCrumbChild>
                    {isAdmin && currentPPSSurveyForm?.surveyType !== "HOSP" && (
                        <>
                            <Button
                                component={NavLink}
                                to={`/survey/PPSCountryQuestionnaire/${currentCountryQuestionnaire?.id}`}
                                exact={true}
                            >
                                <span>{currentCountryQuestionnaire?.orgUnitCode}</span>
                            </Button>
                            <ChevronRightIcon />
                        </>
                    )}
                    <Button component={NavLink} to={`/surveys/PPSHospitalForm`} exact={true}>
                        <span>{i18n.t("Hospitals")}</span>
                    </Button>
                </StyledBreadCrumbChild>
            )}

            {(formType === "PPSWardRegister" || formType === "PPSPatientRegister") && (
                <StyledBreadCrumbChild>
                    <Button
                        component={NavLink}
                        to={`/survey/PPSHospitalForm/${currentHospitalForm?.id}`}
                        exact={true}
                    >
                        <span>{currentHospitalForm?.name}</span>
                    </Button>
                    <ChevronRightIcon />
                    <Button component={NavLink} to={`/surveys/PPSWardRegister`} exact={true}>
                        <span>{i18n.t("Wards")}</span>
                    </Button>
                </StyledBreadCrumbChild>
            )}

            {formType === "PPSPatientRegister" && (
                <StyledBreadCrumbChild>
                    <Button
                        component={NavLink}
                        to={`/survey/PPSWardRegister/${currentWardRegister?.id}`}
                        exact={true}
                    >
                        <span>{currentWardRegister?.name}</span>
                    </Button>
                    <ChevronRightIcon />
                    <Button component={NavLink} to={`/surveys/PPSPatientRegister`} exact={true}>
                        <span>{i18n.t("Patients")}</span>
                    </Button>
                </StyledBreadCrumbChild>
            )}
        </StyledBreadCrumbs>
    );
};

export const StyledBreadCrumbChild = styled.div`
    display: flex;
    align-items: center;
`;

export const StyledBreadCrumbs = styled(Breadcrumbs)`
    font-weight: 300;

    a {
        padding: 0px;
    }
    li {
        display: flex;
        align-items: center;
        .MuiButton-root {
            span {
                color: ${palette.primary.main};
            }
        }
        .MuiButton-text {
            min-width: 0;
        }
    }
    svg {
        color: ${palette.shadow};
    }
    .MuiBreadcrumbs-separator {
        padding: 0;
        margin: 0;
    }
`;
