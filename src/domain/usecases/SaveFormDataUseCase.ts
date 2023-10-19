import { Id } from "@eyeseetea/d2-api";
import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { Questionnaire } from "../entities/Questionnaire";
import { PPS_SURVEY_FORM_ID, SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import _ from "../../domain/entities/generic/Collection";

export class SaveFormDataUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyType: SURVEY_FORM_TYPES,
        questionnaire: Questionnaire,
        orgUnitId: Id
    ): FutureData<void> {
        let programId = "";
        switch (surveyType) {
            case "PPSSurveyForm":
                programId = PPS_SURVEY_FORM_ID;
                break;
            default:
                return Future.error(new Error("Unknown survey type"));
        }

        const event = this.mapQuestionnaireToEvent(questionnaire, orgUnitId, programId);

        return this.surveyReporsitory.saveFormData({ events: [event] }, "CREATE_AND_UPDATE");
    }

    private mapQuestionnaireToEvent(
        questionnaire: Questionnaire,
        orgUnitId: string,
        programId: Id
        // eventId: string | undefined = undefined
    ): D2TrackerEvent {
        const questions = questionnaire.sections.flatMap(section => section.questions);

        const dataValues = _(
            questions.map(q => {
                if (q) {
                    if (q.type === "select" && q.value) {
                        return {
                            dataElement: q.id,
                            value: q.value.code,
                        };
                    } else {
                        return {
                            dataElement: q.id,
                            value: q.value,
                        };
                    }
                }
            })
        )
            .compact()
            .value();

        // if (eventId) {
        //     return this.surveyReporsitory.getEventById(eventId).flatMap(event => {
        //         const updatedEvent: D2TrackerEvent = {
        //             ...event,
        //             status: eventStatus,
        //             dataValues: dataValues as DataValue[],
        //         };
        //         return Future.success({ event: updatedEvent, confidential, message });
        //     });
        // } else {
        const event: D2TrackerEvent = {
            event: "",
            orgUnit: orgUnitId,
            program: programId,
            status: "ACTIVE",
            occurredAt: new Date().toISOString().split("T")?.at(0) || "",
            //@ts-ignore
            dataValues: dataValues,
        };
        return event;

        // }
    }
}
