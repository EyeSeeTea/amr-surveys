import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import {
    D2ProgramRule,
    D2ProgramRuleAction,
    D2ProgramRuleVariable,
    Option,
    Program,
    ProgramDataElement,
    ProgramStage,
    ProgramStageSection,
    TrackedEntityAttibute,
} from "../entities/D2Program";
import { D2TrackerTrackedEntity as TrackedEntity } from "@eyeseetea/d2-api/api/trackerTrackedEntities";
import { Id, Ref } from "../../domain/entities/Ref";
import {
    Questionnaire,
    QuestionnaireEntity,
    QuestionnaireStage,
} from "../../domain/entities/Questionnaire/Questionnaire";
import { QuestionnaireSection } from "../../domain/entities/Questionnaire/QuestionnaireSection";
import { getTrackedEntityAttributeType, isTrackerProgram } from "./surveyProgramHelper";
import { QuestionnaireRule } from "../../domain/entities/Questionnaire/QuestionnaireRules";
import {
    Question,
    isAntibioticQuestion,
    isSpeciesQuestion,
} from "../../domain/entities/Questionnaire/QuestionnaireQuestion";
import _ from "../../domain/entities/generic/Collection";
import {
    mapProgramDataElementToQuestions,
    mapQuestionsToDataValues,
    mapRepeatedStageEventToQuestions,
    mapTrackedAttributesToQuestions,
} from "./questionHelper";
import { getProgramRules } from "./ruleHelper";
import { FutureData, apiToFuture } from "../api-futures";
import { Future } from "../../domain/entities/generic/Future";
import { D2Api } from "@eyeseetea/d2-api/2.36";
import {
    D2TrackerEnrollment,
    D2TrackerEnrollmentAttribute,
} from "@eyeseetea/d2-api/api/trackerEnrollments";
import { DataValue } from "@eyeseetea/d2-api";
import { generateUid } from "../../utils/uid";
import i18n from "../../utils/i18n";

const AntibioticTreatmentHospitalEpisodeSectionName =
    `Antibiotic treatments during hospital episode`.toLowerCase();

export const mapProgramToQuestionnaire = (
    program: Program,
    event: D2TrackerEvent | undefined,
    trackedEntity: TrackedEntity | undefined,
    programDataElements: Ref[],
    dataElements: ProgramDataElement[],
    options: Option[],
    programStages?: ProgramStage[],
    programStageSections?: ProgramStageSection[],
    trackedEntityAttributes?: TrackedEntityAttibute[],
    programRules?: D2ProgramRule[],
    programRuleVariables?: D2ProgramRuleVariable[],
    programRuleActions?: D2ProgramRuleAction[]
): Questionnaire => {
    //If the Program has sections, fetch and use programStageSections
    const sections: QuestionnaireSection[] = programStageSections
        ? programStageSections.map(section => {
              const questions = mapProgramDataElementToQuestions(
                  isTrackerProgram(program.id),
                  section.dataElements,
                  dataElements,
                  options,
                  event,
                  trackedEntity
              );

              return {
                  title: section.name,
                  code: section.id,
                  questions: questions,
                  isVisible: true,
                  stageId: section.programStage.id,
                  sortOrder: section.sortOrder,
                  isAntibioticSection: questions.some(isAntibioticQuestion),
                  isSpeciesSection: questions.some(isSpeciesQuestion),
                  isAntibioticTreatmentHospitalEpisodeSection:
                      section.name.toLowerCase() === AntibioticTreatmentHospitalEpisodeSectionName,
              };
          })
        : //If the Program has no sections, create a single section
          [
              {
                  title: "Survey Info",
                  code: "default",
                  questions: mapProgramDataElementToQuestions(
                      isTrackerProgram(program.id),
                      programDataElements,
                      dataElements,
                      options,
                      event,
                      trackedEntity
                  ),
                  isVisible: true,
                  stageId: "default",
                  sortOrder: 1,
                  isAntibioticSection: false,
                  isSpeciesSection: false,
                  isAntibioticTreatmentHospitalEpisodeSection: false,
              },
          ];

    //If the Program has stages, fetch and use programStages
    const stages: QuestionnaireStage[] = programStages
        ? getParsedProgramStages(
              programStages,
              sections,
              trackedEntity,
              dataElements,
              options,
              programStageSections
          )
        : getDefaultProgramStage(sections);

    const orgUnitId = isTrackerProgram(program.id)
        ? trackedEntity?.orgUnit ?? ""
        : event?.orgUnit ?? "";

    const questionnaireRules: QuestionnaireRule[] = getProgramRules(
        programRules,
        programRuleVariables,
        programRuleActions
    );

    const form = {
        id: program.id,
        name: program.name,
        description: program.name,
        orgUnit: { id: orgUnitId },
        year: "",
        isCompleted: false,
        isMandatory: false,
        stages: _(stages)
            .sortBy(stage => stage.sortOrder)
            .value(),
        subLevelDetails: {
            enrollmentId: trackedEntity ? trackedEntity.enrollments?.at(0)?.enrollment ?? "" : "",
        },
        rules: questionnaireRules,
    };

    if (trackedEntityAttributes) {
        const profileQuestions: Question[] = mapTrackedAttributesToQuestions(
            trackedEntityAttributes,
            options,
            trackedEntity
        );

        const profileSection: QuestionnaireEntity = {
            title: "Profile",
            code: "PROFILE",
            questions: profileQuestions,
            isVisible: true,
            stageId: "PROFILE",
        };

        return Questionnaire.create({ ...form, entity: profileSection });
    }
    return Questionnaire.create(form);
};

const getParsedProgramStages = (
    programStages: ProgramStage[],
    sections: QuestionnaireSection[],
    trackedEntity: TrackedEntity | undefined,
    dataElements: ProgramDataElement[],
    options: Option[],
    programStageSections?: ProgramStageSection[]
): QuestionnaireStage[] => {
    const parsedProgramStages: QuestionnaireStage[] = _(
        programStages.map(stage => {
            const currentProgramStageSections =
                programStages.length === 1 //If there is only 1 program stage, then all the sections belong to it.
                    ? sections
                    : sections.filter(section => section.stageId === stage.id);

            if (stage.repeatable && trackedEntity) {
                return getRepeatedStageEvents(
                    trackedEntity,
                    stage,
                    dataElements,
                    options,
                    programStageSections
                );
            } else {
                return {
                    id: stage.id,
                    title: stage.name,
                    code: stage.id,
                    sections: _(currentProgramStageSections)
                        .sortBy(section => section.sortOrder)
                        .value(),
                    isVisible: true,
                    instanceId: trackedEntity?.enrollments
                        ?.at(0)
                        ?.events.find(e => e.programStage === stage.id)?.event,
                    sortOrder: stage.sortOrder,
                    repeatable: stage.repeatable,
                };
            }
        })
    )
        .flatten()
        .value();

    return parsedProgramStages;
};
const getRepeatedStageEvents = (
    trackedEntity: TrackedEntity | undefined,
    stage: ProgramStage,
    dataElements: ProgramDataElement[],
    options: Option[],
    programStageSections?: ProgramStageSection[]
): QuestionnaireStage[] | undefined => {
    const repeatedStageEvents = trackedEntity?.enrollments
        ?.at(0)
        ?.events.filter(e => e.programStage === stage.id);

    return repeatedStageEvents?.map((repeatedStageEvt, index) => {
        const newStageId = generateUid();
        const currentRepeatableSections = programStageSections?.filter(
            sections => sections.programStage.id === stage.id
        );

        const currentSections: QuestionnaireSection[] =
            currentRepeatableSections?.map(section => {
                const currentRepeatablequestions = mapRepeatedStageEventToQuestions(
                    section.dataElements,
                    dataElements,
                    options,
                    repeatedStageEvt
                );
                return {
                    title: section.name,
                    code: section.id,
                    questions: currentRepeatablequestions,
                    isVisible: true,
                    stageId: newStageId,
                    sortOrder: section.sortOrder,
                    isAntibioticSection: currentRepeatablequestions.some(isAntibioticQuestion),
                    isSpeciesSection: currentRepeatablequestions.some(isSpeciesQuestion),
                    isAntibioticTreatmentHospitalEpisodeSection:
                        section.name.toLowerCase() ===
                        AntibioticTreatmentHospitalEpisodeSectionName,
                };
            }) ?? [];

        return {
            id: newStageId,
            title: stage.name,
            subTitle:
                stage.id === "tLOW37yZuB9"
                    ? `I${index + 1}-${repeatedStageEvt.event}`
                    : stage.id === "rayB0NQMmwx"
                    ? `T${index + 1}-${repeatedStageEvt.event}`
                    : "",
            code: stage.id,
            sections: _(currentSections)
                .sortBy(section => section.sortOrder)
                .value(),
            isVisible: true,
            instanceId: repeatedStageEvt.event,
            sortOrder: stage.sortOrder,
            repeatable: stage.repeatable,
            isAddedByUser: index === 0 ? false : true,
        };
    });
};
const getDefaultProgramStage = (sections: QuestionnaireSection[]): QuestionnaireStage[] => {
    return [
        {
            id: "STAGE",
            title: "STAGE",
            code: "STAGE",
            sections: _(sections)
                .sortBy(section => section.sortOrder)
                .value(),
            isVisible: true,
            sortOrder: 1,
            repeatable: false,
        },
    ];
};

export const mapQuestionnaireToEvent = (
    questionnaire: Questionnaire,
    orgUnitId: string,
    programId: Id,
    api: D2Api,
    eventId: string | undefined = undefined
): FutureData<{ events: D2TrackerEvent[] }> => {
    const questions = questionnaire.stages.flatMap(stages =>
        stages.sections.flatMap(section => section.questions)
    );

    let dataValues: DataValue[] = [];
    try {
        dataValues = mapQuestionsToDataValues(questions);
    } catch (error) {
        return Future.error(new Error(i18n.t("There was an error processing the form")));
    }

    if (eventId) {
        return getEventProgramById(eventId, api).flatMap(event => {
            if (event) {
                const updatedEvent: D2TrackerEvent = {
                    ...event,

                    dataValues: dataValues as DataValue[],
                };
                return Future.success({ events: [updatedEvent] });
            } else {
                return Future.error(new Error("Unable to find event to update"));
            }
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
        return Future.success({ events: [event] });
    }
};

const mapQuestionnaireToEventsByStage = (
    questionnaire: Questionnaire,
    orgUnitId: string,
    programId: Id
): D2TrackerEvent[] => {
    return questionnaire.stages.map(stage => {
        const dataValuesByStage = stage.sections.flatMap(section => {
            return mapQuestionsToDataValues(section.questions);
        });

        return {
            program: programId,
            event: stage.instanceId ?? "",
            programStage: stage.code,
            orgUnit: orgUnitId,
            dataValues: dataValuesByStage,
            occurredAt: new Date().getTime().toString(),
            status: "ACTIVE",
        };
    });
};

export const mapQuestionnaireToTrackedEntities = (
    questionnaire: Questionnaire,
    orgUnitId: string,
    programId: Id,
    teiId: string | undefined = undefined
): FutureData<{ trackedEntities: TrackedEntity[] }> => {
    let eventsByStage: D2TrackerEvent[] = [];
    try {
        eventsByStage = mapQuestionnaireToEventsByStage(questionnaire, orgUnitId, programId);
    } catch (error) {
        return Future.error(new Error(i18n.t("There was an error processing the form")));
    }

    const attributes: D2TrackerEnrollmentAttribute[] = questionnaire.entity
        ? questionnaire.entity.questions.map(question => {
              if (question.type === "select" && question.value) {
                  return {
                      attribute: question.id,
                      value: question.value.code ? question.value.code : "",
                  };
              } else if (question.type === "date") {
                  return {
                      attribute: question.id,
                      value: question.value ? question.value : new Date(),
                  };
              } else {
                  return {
                      attribute: question.id,
                      value: question.value ? question.value.toString() : "",
                  };
              }
          })
        : [];

    const enrollments: D2TrackerEnrollment[] = [
        {
            orgUnit: orgUnitId,
            program: programId,
            enrollment: questionnaire.subLevelDetails?.enrollmentId ?? "",
            trackedEntityType: getTrackedEntityAttributeType(programId),
            notes: [],
            relationships: [],
            attributes: attributes,
            events: eventsByStage,
            enrolledAt: new Date().getTime().toString(),
            occurredAt: new Date().getTime().toString(),
            createdAt: new Date().getTime().toString(),
            createdAtClient: new Date().getTime().toString(),
            updatedAt: new Date().getTime().toString(),
            updatedAtClient: new Date().getTime().toString(),
            status: "ACTIVE",
            orgUnitName: "",
            followUp: false,
            deleted: false,
            storedBy: "",
        },
    ];

    const entity: TrackedEntity = {
        orgUnit: orgUnitId,
        trackedEntity: teiId ?? "",
        trackedEntityType: getTrackedEntityAttributeType(programId),
        enrollments: enrollments,
    };
    return Future.success({ trackedEntities: [entity] });
};

const getEventProgramById = (eventId: Id, api: D2Api): FutureData<D2TrackerEvent | void> => {
    return apiToFuture(
        api.tracker.events.getById(eventId, {
            fields: { $all: true },
        })
    ).flatMap(resp => {
        if (resp) return Future.success(resp);
        else return Future.success(undefined);
    });
};
