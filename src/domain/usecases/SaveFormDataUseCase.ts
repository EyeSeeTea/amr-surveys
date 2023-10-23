import { DataValue, Id } from "@eyeseetea/d2-api";
import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { Questionnaire } from "../entities/Questionnaire";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import _ from "../../domain/entities/generic/Collection";
import {
    PPS_COUNTRY_QUESTIONNAIRE_ID,
    PPS_SURVEY_FORM_ID,
} from "../../data/repositories/SurveyFormD2Repository";

export class SaveFormDataUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyType: SURVEY_FORM_TYPES,
        questionnaire: Questionnaire,
        orgUnitId: Id,
        eventId: string | undefined = undefined
    ): FutureData<void> {
        let programId = "";
        switch (surveyType) {
            case "PPSSurveyForm":
                programId = PPS_SURVEY_FORM_ID;
                break;
            case "PPSCountryQuestionnaire":
                programId = PPS_COUNTRY_QUESTIONNAIRE_ID;
                break;
            default:
                return Future.error(new Error("Unknown survey type"));
        }

        return this.mapQuestionnaireToEvent(questionnaire, orgUnitId, programId, eventId).flatMap(
            event => {
                return this.surveyReporsitory.saveFormData(
                    { events: [event] },
                    "CREATE_AND_UPDATE"
                );
            }
        );
    }

    private mapQuestionnaireToEvent(
        questionnaire: Questionnaire,
        orgUnitId: string,
        programId: Id,
        eventId: string | undefined = undefined
    ): FutureData<D2TrackerEvent> {
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

        if (eventId) {
            return this.surveyReporsitory.getSurveyById(eventId).flatMap(event => {
                const updatedEvent: D2TrackerEvent = {
                    ...event,

                    dataValues: dataValues as DataValue[],
                };
                return Future.success(updatedEvent);
            });
        } else {
            const event: D2TrackerEvent = {
                event: "",
                orgUnit: orgUnitId,
                program: programId,
                status: "ACTIVE",
                occurredAt: new Date().toISOString().split("T")?.at(0) || "",
                //@ts-ignore
                dataValues: dataValues,
            };
            return Future.success(event);
        }
    }
}
