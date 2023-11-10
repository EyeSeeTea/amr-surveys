import { useEffect, useState } from "react";
import { Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { useAppContext } from "../contexts/app-context";
import { useCurrentOrgUnitContext } from "../contexts/current-org-unit-context/current-orgUnit-context";

export function useSurveys(surveyType: SURVEY_FORM_TYPES) {
    const { compositionRoot } = useAppContext();
    const [surveys, setSurveys] = useState<Survey[]>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const { currentOrgUnitAccess } = useCurrentOrgUnitContext();

    useEffect(() => {
        setLoading(true);
        compositionRoot.surveys.getSurveys.execute(surveyType, currentOrgUnitAccess.orgUnitId).run(
            surveys => {
                setSurveys(surveys);
                setLoading(false);
            },
            err => {
                setError(err.message);
                setLoading(false);
            }
        );
    }, [currentOrgUnitAccess.orgUnitId, compositionRoot.surveys.getSurveys, surveyType]);

    return { surveys, loading, error };
}
