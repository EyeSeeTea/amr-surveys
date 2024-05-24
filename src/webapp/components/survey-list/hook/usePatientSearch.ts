import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { SURVEY_FORM_TYPES, Survey } from "../../../../domain/entities/Survey";
import { useAppContext } from "../../../contexts/app-context";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import i18n from "../../../../utils/i18n";

export const usePatientSearch = (
    filteredSurveys: Survey[] | undefined,
    surveyFormType: SURVEY_FORM_TYPES,
    page: number,
    setTotal: Dispatch<SetStateAction<number | undefined>>
) => {
    const { compositionRoot } = useAppContext();
    const {
        currentHospitalForm,
        currentWardRegister,
        currentFacilityLevelForm,
        currentPrevalenceSurveyForm,
    } = useCurrentSurveys();
    const snackbar = useSnackbar();

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

    const filterSurveys = (searchBy: "patientId" | "patientCode") => {
        const searchKeyword =
            searchBy === "patientId" ? patientIdSearchKeyword : patientCodeSearchKeyword;
        if (surveyFormType === "PPSPatientRegister" && searchKeyword) {
            setIsLoading(true);
            compositionRoot.surveys.getFilteredPPSPatients
                .execute(
                    searchKeyword,
                    currentHospitalForm?.orgUnitId ?? "",
                    currentWardRegister?.id ?? "",
                    searchBy
                )
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
        } else if (surveyFormType === "PrevalenceCaseReportForm" && searchKeyword) {
            setIsLoading(true);
            compositionRoot.surveys.getFilteredPrevalencePatients
                .execute(
                    searchKeyword,
                    currentFacilityLevelForm?.orgUnitId ?? "",
                    currentPrevalenceSurveyForm?.id ?? ""
                )
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
