import { FutureData } from "../../data/api-futures";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { Id } from "../entities/Ref";

import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";
import { ProgramOptionCountMap } from "../entities/Program";
import {
    PREVALENCE_CENTRAL_REF_LAB_FORM_ID,
    PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID,
    PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID,
    PREVALENCE_SUPRANATIONAL_REF_LAB_ID,
} from "../../data/entities/D2Survey";

export class GetChildCountUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId?: Id
    ): FutureData<number | ProgramOptionCountMap> {
        const programId = getProgramId(surveyFormType);
        const programCountMap = this.surveyReporsitory.getSurveyChildCount(
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
                            option: `List Sample Shipments (${pc.count})`,
                            count: pc.count,
                        };
                    } else if (pc.id === PREVALENCE_CENTRAL_REF_LAB_FORM_ID) {
                        return {
                            option: `List Central Ref Labs (${pc.count})`,
                            count: pc.count,
                        };
                    } else if (pc.id === PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID) {
                        return {
                            option: `List Pathogen Isolates Logs (${pc.count})`,
                            count: pc.count,
                        };
                    } else if (pc.id === PREVALENCE_SUPRANATIONAL_REF_LAB_ID) {
                        return {
                            option: `List Supranational Refs (${pc.count})`,
                            count: pc.count,
                        };
                    } else {
                        return {
                            option: ``,
                            count: 0,
                        };
                    }
                });
                return programOptionsMap;
            });
        }
    }
}
