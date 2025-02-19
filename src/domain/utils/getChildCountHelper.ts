import { Id } from "@eyeseetea/d2-api";
import { FutureData } from "../../data/api-futures";
import { ProgramOptionCountMap } from "../entities/Program";
import { ChildCountLabel, SURVEYS_WITH_CHILD_COUNT, SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "./PPSProgramsHelper";
import {
    PREVALENCE_CENTRAL_REF_LAB_FORM_ID,
    PREVALENCE_MORTALITY_COHORT_ENORL_FORM,
    PREVALENCE_MORTALITY_DISCHARGE_FORM,
    PREVALENCE_MORTALITY_FOLLOWUP_FORM_D28,
    PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID,
    PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID,
    PREVALENCE_SUPRANATIONAL_REF_LAB_ID,
} from "../../data/entities/D2Survey";
import { PaginatedSurveyRepository } from "../repositories/PaginatedSurveyRepository";
import { Future } from "../entities/generic/Future";

type GetChildCountType = {
    surveyFormType: SURVEY_FORM_TYPES;
    orgUnitId: Id;
    parentSurveyId: Id;
    secondaryparentId?: Id;
    surveyReporsitory: SurveyRepository | PaginatedSurveyRepository;
};

const isPaginatedSurveyRepository = (
    survey: SurveyRepository | PaginatedSurveyRepository
): survey is PaginatedSurveyRepository => {
    return (survey as PaginatedSurveyRepository).getPaginatedSurveyChildCount !== undefined;
};

export const getChildCount = ({
    surveyFormType,
    orgUnitId,
    parentSurveyId,
    secondaryparentId,
    surveyReporsitory,
}: GetChildCountType): FutureData<ChildCountLabel> => {
    if (!SURVEYS_WITH_CHILD_COUNT.includes(surveyFormType))
        return Future.success({ type: "number", value: 0 });

    const programId = getProgramId(surveyFormType);
    const programCountMapFuture = isPaginatedSurveyRepository(surveyReporsitory)
        ? surveyReporsitory.getPaginatedSurveyChildCount(
              programId,
              orgUnitId,
              parentSurveyId,
              secondaryparentId
          )
        : surveyReporsitory.getNonPaginatedSurveyChildCount(
              programId,
              orgUnitId,
              parentSurveyId,
              secondaryparentId
          );

    return programCountMapFuture.flatMap(programCountMap => {
        if (programCountMap.type === "number") {
            return Future.success({ type: "number", value: programCountMap.value });
        } else if (programCountMap.type === "map") {
            const programOptionsMap: ProgramOptionCountMap = programCountMap.value.map(pc => {
                if (pc.id === PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID) {
                    return {
                        option: { label: `List Sample Shipments (${pc.count})` },
                        count: pc.count,
                    };
                } else if (pc.id === PREVALENCE_CENTRAL_REF_LAB_FORM_ID) {
                    return {
                        option: { label: `List Central Ref Labs Results (${pc.count})` },
                        count: pc.count,
                    };
                } else if (pc.id === PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID) {
                    return {
                        option: { label: `List Pathogen Isolates Logs (${pc.count})` },
                        count: pc.count,
                    };
                } else if (pc.id === PREVALENCE_SUPRANATIONAL_REF_LAB_ID) {
                    return {
                        option: { label: `List Supranational Refs Results (${pc.count})` },
                        count: pc.count,
                    };
                } else if (pc.id === PREVALENCE_MORTALITY_FOLLOWUP_FORM_D28) {
                    return {
                        option: { label: `List D28 Follow-up (${pc.count})` },
                        count: pc.count,
                    };
                } else if (pc.id === PREVALENCE_MORTALITY_DISCHARGE_FORM) {
                    return {
                        option: { label: `List Discharge (${pc.count})` },
                        count: pc.count,
                    };
                } else if (pc.id === PREVALENCE_MORTALITY_COHORT_ENORL_FORM) {
                    return {
                        option: { label: `List Cohort enrolment (${pc.count})` },
                        count: pc.count,
                    };
                } else {
                    return {
                        option: { label: "" },
                        count: 0,
                    };
                }
            });
            return Future.success({ type: "map", value: programOptionsMap });
        } else return Future.error(new Error("Invalid program count map type"));
    });
};
