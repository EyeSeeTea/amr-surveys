import { FutureData } from "../../data/api-futures";
import { PREVALENCE_FACILITY_LEVEL_FORM_ID } from "../../data/entities/D2Survey";
import { Questionnaire } from "../entities/Questionnaire/Questionnaire";
import { Future } from "../entities/generic/Future";
import { SurveyRepository } from "../repositories/SurveyRepository";

export class RemoveRepeatableProgramStageUseCase {
    constructor(private surveyRepository: SurveyRepository) {}

    execute(questionnaire: Questionnaire, stageId: string): FutureData<Questionnaire> {
        //Repeatable Program Stages are only applicable to Prevalence Facility forms

        const eventId = questionnaire.stages.find(stage => stage.id === stageId)?.instanceId;

        if (!eventId)
            return Future.error(new Error("Cannot find event Id correspoding to the stage"));

        return this.surveyRepository
            .deleteEventSurvey(eventId, questionnaire.orgUnit.id, PREVALENCE_FACILITY_LEVEL_FORM_ID)
            .flatMap(() => {
                const updatedQuestionnaire = Questionnaire.removeProgramStage(
                    questionnaire,
                    stageId
                );
                return Future.success(updatedQuestionnaire);
            });
    }
}
