import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { SURVEY_FORM_TYPES, Survey } from "../../../../domain/entities/Survey";
import { useAppContext } from "../../../contexts/app-context";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import i18n from "../../../../utils/i18n";
import { SURVEYS_WITH_FILTER_ENABLED } from "../SurveyList";

export const usePatientSearch = (
    filteredSurveys: Survey[] | undefined,
    surveyFormType: SURVEY_FORM_TYPES,
    setPageSize: Dispatch<SetStateAction<number>>,
    setTotal: Dispatch<SetStateAction<number | undefined>>
) => {
    const { compositionRoot } = useAppContext();
    const { currentHospitalForm, currentFacilityLevelForm } = useCurrentSurveys();
    const snackbar = useSnackbar();

    const [patientSearchKeyword, setPatientSearchKeyword] = useState("");
    const [searchResultSurveys, setSearchResultSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Start with the default surveys to begin with, if they exist
    useEffect(() => {
        if (filteredSurveys && filteredSurveys.length > 0) setSearchResultSurveys(filteredSurveys);
    }, [filteredSurveys]);

    // Every time the patient filter is blank, reset to the default surveys
    useEffect(() => {
        if (!patientSearchKeyword && filteredSurveys) {
            setSearchResultSurveys(filteredSurveys);
        }
    }, [filteredSurveys, patientSearchKeyword]);

    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (
            patientSearchKeyword &&
            SURVEYS_WITH_FILTER_ENABLED.includes(surveyFormType) &&
            event.key === "Enter"
        ) {
            setIsLoading(true);
            const orgUnitId =
                surveyFormType === "PPSPatientRegister"
                    ? currentHospitalForm?.orgUnitId || ""
                    : currentFacilityLevelForm?.orgUnitId || "";

            compositionRoot.surveys.getFilteredPatients
                .execute(patientSearchKeyword, orgUnitId, surveyFormType)
                .run(
                    response => {
                        setSearchResultSurveys(response.objects);
                        setTotal(response.pager.total);
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
        searchResultSurveys,
        patientSearchKeyword,
        setPatientSearchKeyword,
        handleKeyPress,
        isLoading,
    };
};
