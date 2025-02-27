import React from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { SURVEY_FORM_TYPES } from "../../../domain/entities/Survey";
import { SurveyList } from "../../components/survey-list/SurveyList";
import { PPSListBreadCrumbs } from "../../components/survey-list/bread-crumbs/PPSListBreadCrumbs";
import { useCurrentModule } from "../../contexts/current-module-context";
import { PrevalenceListBreadCrumbs } from "../../components/survey-list/bread-crumbs/PrevalenceListBreadCrumbs";
import { useSurveyListPage } from "./useSurveyListPage";

export const SurveyListPage: React.FC = React.memo(() => {
    const { formType } = useParams<{ formType: SURVEY_FORM_TYPES }>();
    const { currentModule } = useCurrentModule();

    const {
        page,
        setPage,
        pageSize,
        setPageSize,
        total,
        setTotal,
        sortDetails,
        setSortDetails,
        getSortDirection,
    } = useSurveyListPage(formType);
    return (
        <ContentWrapper>
            {currentModule?.name === "PPS" && <PPSListBreadCrumbs formType={formType} />}
            {currentModule?.name === "Prevalence" && (
                <PrevalenceListBreadCrumbs formType={formType} />
            )}
            <SurveyList
                surveyFormType={formType}
                page={page}
                pageSize={pageSize}
                total={total}
                setPage={setPage}
                setPageSize={setPageSize}
                setTotal={setTotal}
                setSortDetails={setSortDetails}
                sortDetails={sortDetails}
                getSortDirection={getSortDirection}
            />
        </ContentWrapper>
    );
});

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
