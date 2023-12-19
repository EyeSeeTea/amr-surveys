import { useEffect, useState } from "react";
import { Survey } from "../../../../domain/entities/Survey";
import { useAppContext } from "../../../contexts/app-context";
import { useCurrentSurveys } from "../../../contexts/current-surveys-context";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import i18n from "../../../../utils/i18n";

export const useSurveyFilters = (filteredSurveys: Survey[] | undefined) => {
    const { compositionRoot } = useAppContext();
    const { currentHospitalForm } = useCurrentSurveys();
    const snackbar = useSnackbar();

    const [patientFilterKeyword, setPatientFilterKeyword] = useState("");
    const [surveyList, setSurveyList] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (filteredSurveys && filteredSurveys.length > 0) setSurveyList(filteredSurveys);
    }, [filteredSurveys]);

    useEffect(() => {
        if (!patientFilterKeyword && filteredSurveys) {
            setSurveyList(filteredSurveys);
        }
    }, [filteredSurveys, patientFilterKeyword]);

    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (patientFilterKeyword && event.key === "Enter") {
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
