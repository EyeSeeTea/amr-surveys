import { Id } from "@eyeseetea/d2-api";
import { FutureData } from "../../data/api-futures";
import { ProgramOptionCountMap } from "../entities/Program";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "./PPSProgramsHelper";
import {
    PREVALENCE_CENTRAL_REF_LAB_FORM_ID,
    PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID,
    PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID,
    PREVALENCE_SUPRANATIONAL_REF_LAB_ID,
} from "../../data/entities/D2Survey";

type GetChildCountType = {
    surveyFormType: SURVEY_FORM_TYPES;
    orgUnitId: Id;
    parentSurveyId: Id;
    secondaryparentId?: Id;
    surveyReporsitory: SurveyRepository;
};

export const getChildCount = ({
    surveyFormType,
    orgUnitId,
    parentSurveyId,
    secondaryparentId,
    surveyReporsitory,
}: GetChildCountType): FutureData<number | ProgramOptionCountMap> => {
    const programId = getProgramId(surveyFormType);
    const programCountMap = surveyReporsitory.getSurveyChildCount(
        programId,
        orgUnitId,
        parentSurveyId,
        secondaryparentId
    );

    if (programCountMap.type === "value") {
        return programCountMap.value;
    } else {
        return programCountMap.value.map(programCountMap => {
            const programOptionsMap: ProgramOptionCountMap = programCountMap.map(pc => {
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
                } else {
                    return {
                        option: { label: "" },
                        count: 0,
                    };
                }
            });
            return programOptionsMap;
        });
    }
};
