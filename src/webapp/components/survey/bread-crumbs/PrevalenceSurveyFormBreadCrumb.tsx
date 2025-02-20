import { Button } from "@material-ui/core";
import { NavLink } from "react-router-dom";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";
import { SURVEY_FORM_TYPES } from "../../../../domain/entities/Survey";
import i18n from "@eyeseetea/feedback-component/locales";
import { Id } from "../../../../domain/entities/Ref";
import {
    StyledBreadCrumbChild,
    StyledBreadCrumbs,
} from "../../survey-list/bread-crumbs/PPSListBreadCrumbs";
import { getSurveyDisplayName } from "../../../../domain/utils/PPSProgramsHelper";
import { useIsPrevelanceChild } from "../../../hooks/useIsPrevelanceChild";

export interface PrevalenceSurveyFormBreadCrumbProps {
    formType: SURVEY_FORM_TYPES;
    id: Id;
}

export const PrevalenceSurveyFormBreadCrumb: React.FC<PrevalenceSurveyFormBreadCrumbProps> = ({
    formType,
    id,
}) => {
    const { currentPrevalenceSurveyForm, currentFacilityLevelForm, currentCaseReportForm } =
        useCurrentSurveys();
    const { isPrevelanceChild } = useIsPrevelanceChild(formType);

    return (
        <StyledBreadCrumbs aria-label="breadcrumb" separator={<ChevronRightIcon />}>
            <Button component={NavLink} to={`/surveys/PrevalenceSurveyForm`} exact={true}>
                <span>{i18n.t("Prevalence Surveys")}</span>
            </Button>

            <StyledBreadCrumbChild>
                {currentPrevalenceSurveyForm ? (
                    <Button
                        component={NavLink}
                        to={`/survey/PrevalenceSurveyForm/${currentPrevalenceSurveyForm.id}`}
                        exact={true}
                    >
                        <span>{currentPrevalenceSurveyForm.name}</span>
                    </Button>
                ) : (
                    <Button>
                        <span>{i18n.t("New Survey")}</span>
                    </Button>
                )}
            </StyledBreadCrumbChild>
            {isPrevelanceChild() && (
                <>
                    <Button
                        component={NavLink}
                        to={`/surveys/PrevalenceFacilityLevelForm`}
                        exact={true}
                    >
                        <span>{i18n.t(`Facilities`)}</span>
                    </Button>
                    <ChevronRightIcon />
                    <StyledBreadCrumbChild>
                        {currentFacilityLevelForm ? (
                            <Button
                                component={NavLink}
                                to={`/survey/PrevalenceFacilityLevelForm/${currentFacilityLevelForm.id}`}
                                exact={true}
                            >
                                <span>{currentFacilityLevelForm.name}</span>
                            </Button>
                        ) : (
                            <Button>
                                <span>{i18n.t("New Survey")}</span>
                            </Button>
                        )}
                    </StyledBreadCrumbChild>
                </>
            )}
            {isPrevelanceChild() && !(formType === "PrevalenceFacilityLevelForm") && (
                <>
                    <Button
                        component={NavLink}
                        to={`/surveys/PrevalenceCaseReportForm`}
                        exact={true}
                    >
                        <span>{i18n.t(`Case reports`)}</span>
                    </Button>
                    <ChevronRightIcon />
                    <StyledBreadCrumbChild>
                        {currentCaseReportForm ? (
                            <Button
                                component={NavLink}
                                to={`/survey/PrevalenceCaseReportForm/${currentCaseReportForm.id}`}
                                exact={true}
                            >
                                <span>{currentCaseReportForm.name}</span>
                            </Button>
                        ) : (
                            <Button>
                                <span>{i18n.t("New Survey")}</span>
                            </Button>
                        )}
                    </StyledBreadCrumbChild>
                </>
            )}
            {isPrevelanceChild() &&
                !(formType === "PrevalenceCaseReportForm") &&
                !(formType === "PrevalenceFacilityLevelForm") && (
                    <>
                        <Button component={NavLink} to={`/surveys/${formType}`} exact={true}>
                            <span>{i18n.t(`${getSurveyDisplayName(formType)} List`)}</span>
                        </Button>
                        <ChevronRightIcon />
                        <StyledBreadCrumbChild>
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
                    </>
                )}
        </StyledBreadCrumbs>
    );
};
