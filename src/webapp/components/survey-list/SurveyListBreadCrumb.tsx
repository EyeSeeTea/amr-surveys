import { Breadcrumbs, Button } from "@material-ui/core";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { palette } from "../../pages/app/themes/dhis2.theme";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import i18n from "@eyeseetea/feedback-component/locales";

export interface SurveyListBreadCrumbProps {
    type: SURVEY_FORM_TYPES;
}

export const SurveyListBreadCrumb: React.FC<SurveyListBreadCrumbProps> = ({ type }) => {
    const { currentPPSSurveyForm, currentCountryQuestionnaire, currentHospitalForm } =
        useCurrentSurveys();
    return (
        <StyledBreadCrumbs aria-label="breadcrumb" separator="">
            <Button component={NavLink} to={`/surveys/PPSSurveyForm`} exact={true}>
                <span> {i18n.t("PPS Survey Forms")}</span>
            </Button>
            {(type === "PPSCountryQuestionnaire" ||
                type === "PPSHospitalForm" ||
                type === "PPSWardRegister") && (
                <StyledBreadCrumbChild>
                    <ChevronRightIcon />
                    <Button
                        component={NavLink}
                        to={`/survey/PPSSurveyForm/${currentPPSSurveyForm}`}
                        exact={true}
                    >
                        <span>{currentPPSSurveyForm}</span>
                    </Button>
                    <ChevronRightIcon />
                    <Button>
                        <span>{i18n.t("PPS Country Questionnaires")}</span>
                    </Button>
                </StyledBreadCrumbChild>
            )}
            {(type === "PPSHospitalForm" || type === "PPSWardRegister") && (
                <StyledBreadCrumbChild>
                    <ChevronRightIcon />
                    <Button
                        component={NavLink}
                        to={`/survey/PPSCountryQuestionnaire/${currentCountryQuestionnaire?.id}`}
                        exact={true}
                    >
                        <span>{currentCountryQuestionnaire?.id}</span>
                    </Button>
                    <ChevronRightIcon />
                    <Button>
                        <span>{i18n.t("PPS Hospital Forms")}</span>
                    </Button>
                </StyledBreadCrumbChild>
            )}

            {type === "PPSWardRegister" && (
                <StyledBreadCrumbChild>
                    <ChevronRightIcon />
                    <Button
                        component={NavLink}
                        to={`/survey/PPSHospitalForm/${currentHospitalForm?.id}`}
                        exact={true}
                    >
                        <span>{currentHospitalForm?.id}</span>
                    </Button>
                    <ChevronRightIcon />
                    <Button>
                        <span>{i18n.t("PPS Ward Registers")}</span>
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
    font-weight: 400;
    li {
        display: flex;
        align-items: center;
        p {
            padding: 6px 8px;
        }
        .MuiButton-root {
            span {
                color: ${palette.primary.main};
                font-size: 15px;
            }
        }
    }
    svg {
        color: ${palette.shadow};
    }
`;
