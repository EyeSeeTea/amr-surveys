import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { ImportStrategy, ProgramCountMap } from "../../../domain/entities/Program";
import { Future } from "../../../domain/entities/generic/Future";
import { Questionnaire } from "../../../domain/entities/Questionnaire/Questionnaire";
import { Id } from "../../../domain/entities/Ref";
import { Survey } from "../../../domain/entities/Survey";
import { SurveyRepository } from "../../../domain/repositories/SurveyRepository";
import { FutureData } from "../../api-futures";
import { PPS_SURVEY_FORM_ID } from "../../entities/D2Survey";

export class SurveyTestRepository implements SurveyRepository {
    getSurveyChildCount(
        _parentProgram: string,
        _orgUnitId: string,
        _parentSurveyId: string,
        _secondaryparentId: string | undefined
    ):
        | { type: "value"; value: FutureData<number> }
        | { type: "map"; value: FutureData<ProgramCountMap> } {
        throw new Error("Method not implemented.");
    }
    deleteSurvey(_id: string, _orgUnitId: string, _programId: string): FutureData<void> {
        throw new Error("Method not implemented.");
    }
    getSurveyNameFromId(_id: string): FutureData<string> {
        throw new Error("Method not implemented.");
    }

    getPopulatedSurveyById(eventId: string, programId: string): FutureData<Questionnaire> {
        console.debug(eventId, programId);
        throw new Error("Method not implemented.");
    }
    getForm(programId: string): FutureData<Questionnaire> {
        const questionnaire: Questionnaire = Questionnaire.create({
            id: programId,
            name: "Test Questionnaire",
            description: "Test Questionnaire",
            stages: [
                {
                    id: "S1",
                    isVisible: true,
                    code: "S1",
                    title: "Stage1",
                    sections: [
                        {
                            code: "s1",
                            isVisible: true,
                            title: "Section1",
                            questions: [],
                            stageId: "S1",
                            sortOrder: 1,
                        },
                    ],
                    sortOrder: 1,
                    repeatable: false,
                },
            ],

            orgUnit: { id: "OU1" },
            isCompleted: false,
            isMandatory: false,
            year: "2023",
            rules: [],
        });
        return Future.success(questionnaire);
    }

    saveFormData(
        events: Questionnaire,
        action: ImportStrategy,
        orgUnitId: Id,
        eventId: string | undefined,
        programId: Id
    ): FutureData<void> {
        if (events && action && orgUnitId && eventId && programId) return Future.success(undefined);
        else return Future.error(new Error("An error occured while saving the survey"));
    }

    getSurveys(programId: string, orgUnitId: string): FutureData<Survey[]> {
        if (programId === PPS_SURVEY_FORM_ID)
            return Future.success([
                {
                    name: "TestSurvey1",
                    id: "1",
                    startDate: new Date(),
                    status: "ACTIVE",
                    assignedOrgUnit: { id: orgUnitId, name: "OU1" },
                    surveyType: "SUPRANATIONAL",
                    rootSurvey: { id: "1", name: "TestSurvey1", surveyType: "" },
                    surveyFormType: "PPSSurveyForm",
                    childCount: 0,
                },
                {
                    name: "TestSurvey2",
                    id: "2",
                    startDate: new Date(),
                    status: "COMPLETED",
                    assignedOrgUnit: { id: "OU1234", name: "OU2" },
                    surveyType: "NATIONAL",
                    rootSurvey: { id: "2", name: "TestSurvey1", surveyType: "" },
                    surveyFormType: "PPSSurveyForm",
                    childCount: 0,
                },
            ]);
        else return Future.success([]);
    }
    getSurveyById(eventId: string): FutureData<D2TrackerEvent> {
        if (eventId) {
            return Future.success({
                event: "123",
                orgUnit: "OU1",
                program: "1234",
                status: "ACTIVE",
                occurredAt: new Date().toISOString().split("T")?.at(0) || "",
                //@ts-ignore
                dataValues: [
                    { dataElement: "de1", value: "0" },
                    { dataElement: "de2", value: "abc" },
                ],
            });
        } else {
            return Future.error(new Error("Error in getSurveyById"));
        }
    }
}
