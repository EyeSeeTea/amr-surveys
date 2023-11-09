import { Breadcrumbs, Button } from "@material-ui/core";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { palette } from "../../pages/app/themes/dhis2.theme";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import i18n from "@eyeseetea/feedback-component/locales";
import { Id } from "../../../domain/entities/Ref";

export interface SurveyFormBreadCrumbProps {
    type: SURVEY_FORM_TYPES;
    id: Id;
}

export const SurveyFormBreadCrumb: React.FC<SurveyFormBreadCrumbProps> = ({ type, id }) => {
    const { currentPPSSurveyForm, currentCountryQuestionnaire, currentHospitalForm } =
        useCurrentSurveys();
    return (
        <StyledBreadCrumbs aria-label="breadcrumb" separator="">
            <Button component={NavLink} to={`/surveys/PPSSurveyForm`} exact={true}>
                <span>{i18n.t("PPS Survey Forms")}</span>
            </Button>

            <StyledBreadCrumbChild>
                <ChevronRightIcon />
                {currentPPSSurveyForm ? (
                    <Button>
                        <span>{currentPPSSurveyForm}</span>
                    </Button>
                ) : (
                    <Button>
                        <span>{i18n.t("New Survey")}</span>
                    </Button>
                )}
            </StyledBreadCrumbChild>

            {(type === "PPSCountryQuestionnaire" ||
                type === "PPSHospitalForm" ||
                type === "PPSWardRegister") && (
                <StyledBreadCrumbChild>
                    <ChevronRightIcon />

                    <Button
                        component={NavLink}
                        to={`/surveys/PPSCountryQuestionnaire`}
                        exact={true}
                    >
                        <span>{i18n.t("PPS Country Questionnaires")}</span>
                    </Button>
                    <ChevronRightIcon />
                    {currentCountryQuestionnaire ? (
                        <Button>
                            <span>{currentCountryQuestionnaire.id}</span>
                        </Button>
                    ) : (
                        <Button>
                            <span>{i18n.t("New Survey")}</span>
                        </Button>
                    )}
                </StyledBreadCrumbChild>
            )}
            {(type === "PPSHospitalForm" || type === "PPSWardRegister") && (
                <StyledBreadCrumbChild>
                    <ChevronRightIcon />
                    <Button component={NavLink} to={`/surveys/PPSHospitalForm`} exact={true}>
                        <span>{i18n.t("PPS Hospital Forms")}</span>
                    </Button>
                    <ChevronRightIcon />
                    {currentHospitalForm ? (
                        <Button>
                            <span>{currentHospitalForm.id}</span>
                        </Button>
                    ) : (
                        <Button>
                            <span>{i18n.t("New Survey")}</span>
                        </Button>
                    )}
                </StyledBreadCrumbChild>
            )}
            {type === "PPSWardRegister" && (
                <StyledBreadCrumbChild>
                    <ChevronRightIcon />
                    <Button component={NavLink} to={`/surveys/PPSWardRegister`} exact={true}>
                        <span>{i18n.t("PPS Ward Registers")}</span>
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
