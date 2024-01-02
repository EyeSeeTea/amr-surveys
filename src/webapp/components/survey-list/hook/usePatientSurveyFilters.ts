import { useEffect, useState } from "react";
import { SURVEY_FORM_TYPES, Survey } from "../../../../domain/entities/Survey";
import { useAppContext } from "../../../contexts/app-context";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import i18n from "../../../../utils/i18n";

export const usePatientSurveyFilters = (
    filteredSurveys: Survey[] | undefined,
    surveyFormType: SURVEY_FORM_TYPES
) => {
    const { compositionRoot } = useAppContext();
    const { currentHospitalForm } = useCurrentSurveys();
    const snackbar = useSnackbar();

    const [patientFilterKeyword, setPatientFilterKeyword] = useState("");
    const [surveyList, setSurveyList] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Start with the default surveys to begin with, if they exist
    useEffect(() => {
        if (filteredSurveys && filteredSurveys.length > 0) setSurveyList(filteredSurveys);
    }, [filteredSurveys]);

    // Every time the patient filter is blank, reset to the default surveys
    useEffect(() => {
        if (!patientFilterKeyword && filteredSurveys) {
            setSurveyList(filteredSurveys);
        }
    }, [filteredSurveys, patientFilterKeyword]);

    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (
            patientFilterKeyword &&
            surveyFormType === "PPSPatientRegister" &&
            event.key === "Enter"
        ) {
            setIsLoading(true);
            compositionRoot.surveys.getFilteredPatients
                .execute(patientFilterKeyword, currentHospitalForm?.orgUnitId ?? "")
                .run(
                    surveys => {
                        setSurveyList(surveys);
                        setIsLoading(false);
                    },
                    () => {
                        snackbar.error(i18n.t("Error fetching surveys"));
                        setIsLoading(false);
                    }
                );
        }
    };

    return {
        surveyList,
        patientFilterKeyword,
        setPatientFilterKeyword,
        handleKeyPress,
        isLoading,
    };
};
