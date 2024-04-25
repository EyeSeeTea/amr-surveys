import { Id } from "@eyeseetea/d2-api";
import { SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import { FutureData, apiToFuture } from "../api-futures";
import { getSurveyType } from "./surveyProgramHelper";
import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import {
    PREVALENCE_SURVEY_NAME_DATAELEMENT_ID,
    SURVEY_NAME_DATAELEMENT_ID,
} from "../entities/D2Survey";
import { Future } from "../../domain/entities/generic/Future";
import { D2Api } from "@eyeseetea/d2-api/2.36";

export const getSurveyNameFromId = (
    id: Id,
    surveyFormType: SURVEY_FORM_TYPES,
    api: D2Api
): FutureData<string> => {
    const parentSurveyType = getSurveyType(surveyFormType);

    return getEventProgramById(id, api)
        .flatMap(survey => {
            if (survey) {
                if (parentSurveyType === "PPS") {
                    const ppsSurveyName = survey.dataValues?.find(
                        dv => dv.dataElement === SURVEY_NAME_DATAELEMENT_ID
                    )?.value;
                    return Future.success(ppsSurveyName ?? "");
                } else {
                    const prevalenceSurveyName = survey.dataValues?.find(
                        dv => dv.dataElement === PREVALENCE_SURVEY_NAME_DATAELEMENT_ID
                    )?.value;
                    return Future.success(prevalenceSurveyName ?? "");
                }
            } else return Future.success("");
        })
        .flatMapError(_err => Future.success(""));
};

export const getEventProgramById = (eventId: Id, api: D2Api): FutureData<D2TrackerEvent | void> => {
    return apiToFuture(
        api.tracker.events.getById(eventId, {
            fields: { $all: true },
        })
    ).flatMap(resp => {
        if (resp) return Future.success(resp);
        else return Future.success(undefined);
    });
};
