import { useEffect, useState } from "react";
import { Id } from "../../domain/entities/Ref";
import { Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { useAppContext } from "../contexts/app-context";

export function useSurveys(surveyType: SURVEY_FORM_TYPES, parentSurveyId: Id | undefined) {
    const { compositionRoot } = useAppContext();
    const [surveys, setSurveys] = useState<Survey[]>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    useEffect(() => {
        setLoading(true);
        compositionRoot.surveys.getSurveys.execute(surveyType, parentSurveyId).run(
            surveys => {
                setSurveys(surveys);
                setLoading(false);
            },
            err => {
                setError(err.message);
                setLoading(false);
            }
        );
    }, [compositionRoot.surveys.getSurveys, surveyType, parentSurveyId]);

    return { surveys, loading, error };
}
