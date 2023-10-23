import { useSnackbar } from "@eyeseetea/d2-ui-components";
import i18n from "@eyeseetea/feedback-component/locales";
import { useEffect, useState } from "react";
import { Id } from "../../domain/entities/Ref";
import { Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { useAppContext } from "../contexts/app-context";
import { useCurrentOrgUnitContext } from "../contexts/current-org-unit-context/current-orgUnit-context";

export function useSurveys(surveyType: SURVEY_FORM_TYPES, parentSurveyId: Id | undefined) {
    const { compositionRoot } = useAppContext();
    const [surveys, setSurveys] = useState<Survey[]>();
    const [loading, setLoading] = useState(false);
    const snackbar = useSnackbar();
    const { currentOrgUnitAccess } = useCurrentOrgUnitContext();

    useEffect(() => {
        setLoading(true);
        compositionRoot.surveys.getSurveys
            .execute(surveyType, currentOrgUnitAccess.orgUnitId, parentSurveyId)
            .run(
                surveys => {
                    setSurveys(surveys);
                    setLoading(false);
                },
                err => {
                    snackbar.error(i18n.t(err.message));
                    setLoading(false);
                }
            );
    }, [
        currentOrgUnitAccess.orgUnitId,
        snackbar,
        compositionRoot.surveys.getSurveys,
        surveyType,
        parentSurveyId,
    ]);

    return { surveys, loading };
}
