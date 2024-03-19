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
import { programsWithRepeatableSections } from "../entities/D2Survey";
import { QuestionnaireRule } from "../../domain/entities/Questionnaire/QuestionnaireRules";
import { Question } from "../../domain/entities/Questionnaire/QuestionnaireQuestion";
import _ from "../../domain/entities/generic/Collection";
import {
    mapProgramDataElementToQuestions,
    mapQuestionsToDataValues,
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
              const { questions, sectionAddQuestion } = mapProgramDataElementToQuestions(
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
                  showAddQuestion: sectionAddQuestion,
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
                  ).questions,
                  isVisible: true,
                  stageId: "default",
                  sortOrder: 1,
              },
          ];

    //If the Program has stages, fetch and use programStages
    const stages: QuestionnaireStage[] = programStages
        ? programStages.map(stage => {
              const currentProgramStageSections =
                  programStages.length === 1 //If there is only 1 program stage, then all the sections belong to it.
                      ? sections
                      : sections.filter(section => section.stageId === stage.id);

              //check if current program has repeatable Questions.
              if (programsWithRepeatableSections.find(p => p === program.id)) {
                  const groupedProgramStageSections = _(currentProgramStageSections)
                      .sortBy(s => s.sortOrder)
                      .groupBy(section =>
                          section.title.substring(0, section.title.lastIndexOf(" "))
                      );

                  const processedSections: QuestionnaireSection[] = [];
                  groupedProgramStageSections.forEach(group => {
                      if (group[1].length > 1) {
                          const currentSectionGroup: QuestionnaireSection[] = group[1].map(
                              (section, index) => {
                                  return {
                                      ...section,
                                      isVisible: index === 0 ? true : false,
                                      showAddnew: true,
                                  };
                              }
                          );
                          processedSections.push(...currentSectionGroup);
                      } else processedSections.push(...group[1]);
                  });

                  return {
                      title: stage.name,
                      code: stage.id,
                      sections: _(processedSections)
                          .sortBy(section => section.sortOrder)
                          .value(),
                      isVisible: true,
                      instanceId: trackedEntity?.enrollments
                          ?.at(0)
                          ?.events.find(e => e.programStage === stage.id)?.event,
                  };
              } else {
                  // no need for grouping and hiding logic
                  return {
                      title: stage.name,
                      code: stage.id,
                      sections: _(currentProgramStageSections)
                          .sortBy(section => section.sortOrder)
                          .value(),
                      isVisible: true,
                      instanceId: trackedEntity?.enrollments
                          ?.at(0)
                          ?.events.find(e => e.programStage === stage.id)?.event,
                  };
              }
          })
        : //If the Program has no stages, create a single stage
          [
              {
                  title: "STAGE",
                  code: "STAGE",
                  sections: _(sections)
                      .sortBy(section => section.sortOrder)
                      .value(),
                  isVisible: true,
              },
          ];

    const orgUnitId = isTrackerProgram(program.id)
        ? trackedEntity?.orgUnit ?? ""
        : event?.orgUnit ?? "";

    const questionnaireRules: QuestionnaireRule[] = getProgramRules(
        programRules,
        programRuleVariables,
        programRuleActions
    );

    const form: Questionnaire = {
        id: program.id,
        name: program.name,
        description: program.name,
        orgUnit: { id: orgUnitId },
        year: "",
        isCompleted: false,
        isMandatory: false,
        stages: stages.sort((a, b) => a.title.localeCompare(b.title, "en", { numeric: true })),
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
        form.entity = profileSection;
    }
    return form;
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

    const dataValues = mapQuestionsToDataValues(questions);

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

export const mapQuestionnaireToTrackedEntities = (
    questionnaire: Questionnaire,
    orgUnitId: string,
    programId: Id,
    teiId: string | undefined = undefined
): FutureData<{ trackedEntities: TrackedEntity[] }> => {
    const eventsByStage: D2TrackerEvent[] = questionnaire.stages.map(stage => {
        const dataValuesByStage = stage.sections.flatMap(section => {
            return mapQuestionsToDataValues(section.questions);
        });

        return {
            program: programId,
            event: stage.instanceId ?? "",
            programStage: stage.code,
            orgUnit: orgUnitId,
            dataValues: dataValuesByStage as DataValue[],
            occurredAt: new Date().getTime().toString(),
            status: "ACTIVE",
        };
    });

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
