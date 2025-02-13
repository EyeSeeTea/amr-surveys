import { Breadcrumbs, Button } from "@material-ui/core";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";
import { palette } from "../../../pages/app/themes/dhis2.theme";
import { SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import i18n from "@eyeseetea/feedback-component/locales";
import { useCallback } from "react";
import { getSurveyDisplayName } from "../../../../domain/utils/PPSProgramsHelper";

export interface PrevalenceListBreadCrumbsProps {
    formType: SURVEY_FORM_TYPES;
}

export const PrevalenceListBreadCrumbs: React.FC<PrevalenceListBreadCrumbsProps> = ({
    formType,
}) => {
    const { currentPrevalenceSurveyForm, currentFacilityLevelForm, currentCaseReportForm } =
        useCurrentSurveys();

    const isPrevelanceChild = useCallback(() => {
        return (
            formType === "PrevalenceCaseReportForm" ||
            formType === "PrevalenceCentralRefLabForm" ||
            formType === "PrevalencePathogenIsolatesLog" ||
            formType === "PrevalenceSampleShipTrackForm" ||
            formType === "PrevalenceSupranationalRefLabForm" ||
            formType === "PrevalenceDischarge" ||
            formType === "PrevalenceD28FollowUp" ||
            formType === "PrevalenceCohortEnrolment"
        );
    }, [formType]);

    const getCaseReportNameCrumb = useCallback(() => {
        return (
            <>
                <Button
                    component={NavLink}
                    to={`/survey/PrevalenceCaseReportForm/${currentCaseReportForm?.id}`}
                    exact={true}
                >
                    <span>{currentCaseReportForm?.name}</span>
                </Button>
                <ChevronRightIcon />
            </>
        );
    }, [currentCaseReportForm]);

    return (
        <StyledBreadCrumbs aria-label="breadcrumb" separator={<ChevronRightIcon />}>
            <Button component={NavLink} to={`/surveys/PrevalenceSurveyForm`} exact={true}>
                <span> {i18n.t("Prevalence Surveys")}</span>
            </Button>

            {(formType === "PrevalenceFacilityLevelForm" || isPrevelanceChild()) && (
                <StyledBreadCrumbChild>
                    <>
                        <Button
                            component={NavLink}
                            to={`/survey/PrevalenceSurveyForm/${currentPrevalenceSurveyForm?.id}`}
                            exact={true}
                        >
                            <span>{currentPrevalenceSurveyForm?.name}</span>
                        </Button>
                        <ChevronRightIcon />
                    </>
                    <Button
                        component={NavLink}
                        to={`/surveys/PrevalenceFacilityLevelForm`}
                        exact={true}
                    >
                        <span>{i18n.t("Facilities")}</span>
                    </Button>
                </StyledBreadCrumbChild>
            )}

            {isPrevelanceChild() && (
                <StyledBreadCrumbChild>
                    <>
                        <Button
                            component={NavLink}
                            to={`/survey/PrevalenceFacilityLevelForm/${currentFacilityLevelForm?.id}`}
                            exact={true}
                        >
                            <span>{currentFacilityLevelForm?.name}</span>
                        </Button>
                        <ChevronRightIcon />
                    </>
                    <Button
                        component={NavLink}
                        to={`/surveys/PrevalenceCaseReportForm`}
                        exact={true}
                    >
                        <span>{i18n.t("Case Reports")}</span>
                    </Button>
                </StyledBreadCrumbChild>
            )}

            {isPrevelanceChild() && !(formType === "PrevalenceCaseReportForm") && (
                <StyledBreadCrumbChild>
                    {getCaseReportNameCrumb()}
                    <Button>
                        <span>{i18n.t(`${getSurveyDisplayName(formType)} List`)}</span>
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
