import { Id } from "@eyeseetea/d2-api";
import { FutureData } from "../../data/api-futures";
import { ProgramOptionCountMap } from "../entities/Program";
import {
    ChildCountLabel,
    ChildCountOption,
    SURVEYS_WITH_CHILD_COUNT,
    SURVEY_FORM_TYPES,
} from "../entities/Survey";
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
import i18n from "@eyeseetea/feedback-component/locales";

type GetChildCountType = {
    surveyFormType: SURVEY_FORM_TYPES;
    orgUnitId: Id;
    parentSurveyId: Id;
    secondaryparentId?: Id;
    surveyReporsitory: PaginatedSurveyRepository;
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
    const programCountMapFuture = surveyReporsitory.getPaginatedSurveyChildCount(
        programId,
        orgUnitId,
        parentSurveyId,
        secondaryparentId
    );

    return programCountMapFuture.flatMap(programCountMap => {
        if (programCountMap.type === "number") {
            return Future.success({ type: "number", value: programCountMap.value });
        } else if (programCountMap.type === "map") {
            const programOptionsMap = mapOptionToLabel(programCountMap);
            return Future.success({ type: "map", value: programOptionsMap });
        } else return Future.error(new Error("Invalid program count map type"));
    });
};

const mapOptionToLabel = (programCountMap: ChildCountOption) => {
    const programOptionsMap: ProgramOptionCountMap = programCountMap.value.map(pc => {
        switch (pc.id) {
            case PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID:
                return {
                    option: { label: i18n.t(`List Sample Shipments (${pc.count})`) },
                    count: pc.count,
                };
            case PREVALENCE_CENTRAL_REF_LAB_FORM_ID:
                return {
                    option: { label: i18n.t(`List Central Ref Labs Results (${pc.count})`) },
                    count: pc.count,
                };
            case PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID:
                return {
                    option: { label: i18n.t(`List Pathogen Isolates Logs (${pc.count})`) },
                    count: pc.count,
                };
            case PREVALENCE_SUPRANATIONAL_REF_LAB_ID:
                return {
                    option: { label: i18n.t(`List Supranational Refs Results (${pc.count})`) },
                    count: pc.count,
                };
            case PREVALENCE_MORTALITY_FOLLOWUP_FORM_D28:
                return {
                    option: { label: i18n.t(`List D28 Follow-up (${pc.count})`) },
                    count: pc.count,
                };
            case PREVALENCE_MORTALITY_DISCHARGE_FORM:
                return {
                    option: { label: i18n.t(`List Discharge (${pc.count})`) },
                    count: pc.count,
                };
            case PREVALENCE_MORTALITY_COHORT_ENORL_FORM:
                return {
                    option: { label: i18n.t(`List Cohort enrolment (${pc.count})`) },
                    count: pc.count,
                };
            default:
                return {
                    option: { label: "" },
                    count: 0,
                };
        }
    });
    return programOptionsMap;
};
