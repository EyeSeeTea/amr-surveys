import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { SURVEY_FORM_TYPES, Survey } from "../../../../domain/entities/Survey";
import { useAppContext } from "../../../contexts/app-context";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";
import i18n from "../../../../utils/i18n";
import { useOfflineSnackbar } from "../../../hooks/useOfflineSnackbar";
import { SortColumnDetails } from "../../../../domain/entities/TablePagination";

export const usePatientSearch = (
    filteredSurveys: Survey[] | undefined,
    surveyFormType: SURVEY_FORM_TYPES,
    setTotal: Dispatch<SetStateAction<number | undefined>>,
    sortDetails: SortColumnDetails | undefined
) => {
    const { compositionRoot } = useAppContext();
    const {
        currentHospitalForm,
        currentWardRegister,
        currentFacilityLevelForm,
        currentPrevalenceSurveyForm,
    } = useCurrentSurveys();
    const { offlineError } = useOfflineSnackbar();

    const [patientIdSearchKeyword, setPatientIdSearchKeyword] = useState("");
    const [patientCodeSearchKeyword, setPatientCodeSearchKeyword] = useState("");

    const [searchResultSurveys, setSearchResultSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    //Reset the search keyword for non patient lists
    useEffect(() => {
        if (surveyFormType !== "PPSPatientRegister") {
            setPatientCodeSearchKeyword("");
            setPatientIdSearchKeyword("");
        }
    }, [surveyFormType]);

    // Start with the default surveys to begin with, if they exist
    useEffect(() => {
        if (filteredSurveys && filteredSurveys.length > 0) setSearchResultSurveys(filteredSurveys);
    }, [filteredSurveys]);

    // Every time the patient filter is blank, reset to the default surveys
    useEffect(() => {
        if (!patientIdSearchKeyword && !patientCodeSearchKeyword && filteredSurveys) {
            setSearchResultSurveys(filteredSurveys);
        }
    }, [filteredSurveys, patientCodeSearchKeyword, patientIdSearchKeyword]);

    const filterSurveys = useCallback(
        (searchBy: "patientId" | "patientCode") => {
            const searchKeyword =
                searchBy === "patientId" ? patientIdSearchKeyword : patientCodeSearchKeyword;
            if (surveyFormType === "PPSPatientRegister" && searchKeyword) {
                setIsLoading(true);
                compositionRoot.surveys.getFilteredPPSPatients
                    .execute(
                        searchKeyword,
                        currentHospitalForm?.orgUnitId ?? "",
                        currentWardRegister?.id ?? "",
                        searchBy,
                        sortDetails
                    )
                    .run(
                        response => {
                            setSearchResultSurveys(response.objects);
                            setTotal(response.pager.total);
                            setIsLoading(false);
                        },
                        () => {
                            offlineError(i18n.t("Error fetching surveys"));
                            setIsLoading(false);
                        }
                    );
            } else if (surveyFormType === "PrevalenceCaseReportForm" && searchKeyword) {
                setIsLoading(true);
                compositionRoot.surveys.getFilteredPrevalencePatients
                    .execute(
                        searchKeyword,
                        currentFacilityLevelForm?.orgUnitId ?? "",
                        currentPrevalenceSurveyForm?.id ?? "",
                        sortDetails
                    )
                    .run(
                        response => {
                            setSearchResultSurveys(response.objects);
                            setTotal(response.pager.total);
                            setIsLoading(false);
                        },
                        () => {
                            offlineError(i18n.t("Error fetching surveys"));
                            setIsLoading(false);
                        }
                    );
            }
        },
        [
            compositionRoot,
            currentFacilityLevelForm?.orgUnitId,
            currentHospitalForm?.orgUnitId,
            currentPrevalenceSurveyForm?.id,
            currentWardRegister?.id,
            offlineError,
            patientCodeSearchKeyword,
            patientIdSearchKeyword,
            setTotal,
            sortDetails,
            surveyFormType,
        ]
    );

    const handlePatientIdSearch = (event: React.KeyboardEvent<HTMLDivElement>) => {
        setPatientCodeSearchKeyword("");
        if (event.key === "Enter") {
            filterSurveys("patientId");
        }
    };

    const handlePatientCodeSearch = (event: React.KeyboardEvent<HTMLDivElement>) => {
        setPatientIdSearchKeyword("");
        if (event.key === "Enter") {
            filterSurveys("patientCode");
        }
    };

    return {
        searchResultSurveys,
        patientIdSearchKeyword,
        setPatientIdSearchKeyword,
        handlePatientIdSearch,
        patientCodeSearchKeyword,
        setPatientCodeSearchKeyword,
        handlePatientCodeSearch,
        isLoading,
    };
};
