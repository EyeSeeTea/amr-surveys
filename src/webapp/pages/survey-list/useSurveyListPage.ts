import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useCurrentSurveys } from "../../contexts/current-surveys-context";
import { getUserAccess } from "../../../domain/utils/menuHelper";
import { useAppContext } from "../../contexts/app-context";
import { useCurrentModule } from "../../contexts/current-module-context";
import { useRedirectHome } from "./useRedirectHome";
import {
    PAGE_SIZE,
    SortableColumnName,
    SortColumnDetails,
    SortDirection,
} from "../../../domain/entities/TablePagination";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";

export function useSurveyListPage(formType: SURVEY_FORM_TYPES) {
    const [page, setPage] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(PAGE_SIZE);
    const [total, setTotal] = useState<number>();
    const [sortDetails, setSortDetails] = useState<SortColumnDetails>();

    const history = useHistory();
    const {
        currentUser: { userGroups },
    } = useAppContext();
    const { currentModule } = useCurrentModule();
    const isAdmin = currentModule ? getUserAccess(currentModule, userGroups).hasAdminAccess : false;
    const { shouldRedirectToHome } = useRedirectHome();

    const { resetCurrentPPSSurveyForm, resetCurrentPrevalenceSurveyForm } = useCurrentSurveys();

    useEffect(() => {
        //reset page on new survey list load.
        setPage(0);
        setTotal(undefined);

        //reset sort details on new survey list load.
        setSortDetails(undefined);

        //reset all current survey context when root form of either module is listed.
        if (
            formType === "PPSSurveyForm" ||
            formType === "PrevalenceSurveyForm" ||
            (!isAdmin &&
                (formType === "PrevalenceFacilityLevelForm" || formType === "PPSHospitalForm"))
        ) {
            resetCurrentPPSSurveyForm();
            resetCurrentPrevalenceSurveyForm();
        } else if (shouldRedirectToHome(formType)) {
            //Redirecting to home page.
            history.push("/");
        }
    }, [
        formType,
        history,
        resetCurrentPPSSurveyForm,
        resetCurrentPrevalenceSurveyForm,
        shouldRedirectToHome,
        isAdmin,
    ]);

    const getSortDirection = useCallback(
        (column: SortableColumnName): SortDirection => {
            if (sortDetails?.column === column) {
                return sortDetails.direction;
            }
            return "asc";
        },
        [sortDetails]
    );

    return {
        page,
        setPage,
        pageSize,
        setPageSize,
        total,
        setTotal,
        sortDetails,
        setSortDetails,
        getSortDirection,
    };
}
