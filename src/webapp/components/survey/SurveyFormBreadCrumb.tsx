import { Breadcrumbs, Button } from "@material-ui/core";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { palette } from "../../pages/app/themes/dhis2.theme";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { Id } from "../../../domain/entities/Ref";
import i18n from "@eyeseetea/feedback-component/locales";

export interface SurveyFormBreadCrumbProps {
    type: SURVEY_FORM_TYPES;
    id: Id;
}

export const SurveyFormBreadCrumb: React.FC<SurveyFormBreadCrumbProps> = ({ type, id }) => {
    const { currentPPSSurveyForm } = useCurrentSurveys();
    return (
        <StyledBreadCrumbs aria-label="breadcrumb" separator="">
            <Button component={NavLink} to={`/surveys/PPSSurveyForm`} exact={true}>
                <span>{i18n.t("PPS Survey Forms")}</span>
            </Button>
            {type === "PPSSurveyForm" && (
                <StyledBreadCrumbChild>
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
            {type === "PPSCountryQuestionnaire" && (
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
                    <Button
                        component={NavLink}
                        to={`/surveys/PPSCountryQuestionnaire`}
                        exact={true}
                    >
                        <span>{i18n.t("PPS Country Questionnaires")}</span>
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
