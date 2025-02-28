import { D2Api } from "@eyeseetea/d2-api/2.36";
import { Future } from "../../domain/entities/generic/Future";
import { Id } from "../../domain/entities/Ref";
import { SurveyRepository } from "../../domain/repositories/SurveyRepository";
import { apiToFuture, FutureData } from "../api-futures";
import _ from "../../domain/entities/generic/Collection";
import { ImportStrategy } from "../../domain/entities/Program";
import { ChildCount, Survey, SURVEY_FORM_TYPES } from "../../domain/entities/Survey";
import {
    TrackedEntitiesGetResponse,
    D2TrackedEntityInstanceToPost,
    D2TrackerTrackedEntity,
} from "@eyeseetea/d2-api/api/trackerTrackedEntities";
import {
    getParentDataElementForProgram,
    getSurveyType,
    getTrackedEntityAttributeType,
    isTrackerProgram,
} from "../utils/surveyProgramHelper";
import {
    PREVALENCE_FACILITY_LEVEL_FORM_ID,
    PPS_WARD_REGISTER_ID,
    PPS_HOSPITAL_FORM_ID,
    PPS_PATIENT_REGISTER_ID,
    SURVEY_NAME_DATAELEMENT_ID,
    PREVALENCE_SURVEY_NAME_DATAELEMENT_ID,
    AMR_SURVEYS_PREVALENCE_DEA_CUSTOM_AST_GUIDE,
    AMR_SURVEYS_PREVALENCE_DEA_AST_GUIDELINES,
    PPS_COUNTRY_QUESTIONNAIRE_ID,
    PREVALENCE_SURVEY_FORM_ID,
} from "../entities/D2Survey";
import { ProgramDataElement, ProgramMetadata } from "../entities/D2Program";
import {
    mapProgramToQuestionnaire,
    mapQuestionnaireToEvent,
    mapQuestionnaireToTrackedEntities,
} from "../utils/surveyFormMappers";
import {
    D2TrackerEntitySelectedPick,
    mapEventToSurvey,
    mapTrackedEntityToSurvey,
    trackedEntityFields,
} from "../utils/surveyListMappers";
import { Questionnaire } from "../../domain/entities/Questionnaire/Questionnaire";
import { ASTGUIDELINE_TYPES } from "../../domain/entities/ASTGuidelines";
import { getSurveyChildCount } from "../utils/surveyChildCountHelper";
import { TrackerPostRequest, TrackerPostResponse } from "@eyeseetea/d2-api/api/tracker";
import { Maybe } from "../../utils/ts-utils";
import { D2TrackerEvent, D2TrackerEventToPost } from "@eyeseetea/d2-api/api/trackerEvents";
import { OrgUnitBasic } from "../../domain/entities/OrgUnit";

const OU_CHUNK_SIZE = 500;

type Filter = {
    id: string;
    value: string;
};

export class SurveyD2Repository implements SurveyRepository {
    constructor(private api: D2Api) {}

    getForm(
        programId: Id,
        eventId: Id | undefined,
        orgUnitId: Id | undefined
    ): FutureData<Questionnaire> {
        return apiToFuture(
            this.api.request<ProgramMetadata>({
                method: "get",
                url: `/programs/${programId}/metadata.json?fields=programs,dataElements,programStageDataElements.dataElement,programStageSections,programTrackedEntityAttributes,trackedEntityAttributes,programStages,programRules,programRuleVariables,programRuleActions`,
            })
        ).flatMap(resp => {
            if (resp.programs[0]) {
                const programDataElements = resp.programStageDataElements.map(
                    psde => psde.dataElement
                );

                const dataElementsWithSortOrder: ProgramDataElement[] = resp.programStageSections
                    ? resp.programStageSections.flatMap(section => {
                          const sortedSectionDataElements: ProgramDataElement[] = _(
                              section.dataElements.map((sectionDataElement, index) => {
                                  const currentDataElement: ProgramDataElement | undefined =
                                      resp.dataElements.find(de => de.id === sectionDataElement.id);

                                  if (!currentDataElement) return null;
                                  const sectionDataElementWithSortOrder: ProgramDataElement = {
                                      ...currentDataElement,
                                      sortOrder: index,
                                  };

                                  return sectionDataElementWithSortOrder;
                              })
                          )
                              .compact()
                              .value();

                          return sortedSectionDataElements;
                      })
                    : resp.dataElements.map(de => {
                          return {
                              ...de,
                              sortOrder: resp.programStageDataElements.find(
                                  psde => psde.dataElement.id === de.id
                              )?.sortOrder,
                          };
                      });

                const sortedTrackedentityAttr = resp.programTrackedEntityAttributes
                    ? _(
                          _(resp.programTrackedEntityAttributes)
                              .sortBy(te => te.sortOrder)
                              .value()
                              .map(pste =>
                                  resp.trackedEntityAttributes?.find(
                                      te => te.id === pste.trackedEntityAttribute.id
                                  )
                              )
                      )
                          .compact()
                          .value()
                    : resp.trackedEntityAttributes;

                const sortedOptions = _(resp.options)
                    .sortBy(option => option.sortOrder)
                    .value();

                //If event specified,populate the form
                if (eventId) {
                    if (isTrackerProgram(programId)) {
                        if (!orgUnitId && programId !== PPS_PATIENT_REGISTER_ID)
                            return Future.error(new Error("Survey not found"));
                        return this.getTrackerProgramById(eventId, programId).flatMap(
                            trackedEntity => {
                                if (resp.programs[0] && trackedEntity) {
                                    return Future.success(
                                        mapProgramToQuestionnaire(
                                            resp.programs[0],
                                            undefined,
                                            trackedEntity,
                                            programDataElements,
                                            dataElementsWithSortOrder,
                                            sortedOptions,
                                            resp.programStages,
                                            resp.programStageSections,
                                            sortedTrackedentityAttr,
                                            resp.programRules,
                                            resp.programRuleVariables,
                                            resp.programRuleActions
                                        )
                                    );
                                } else {
                                    return Future.error(new Error("Survey not found"));
                                }
                            }
                        );
                    }
                    //Get event from eventId
                    else {
                        return this.getEventProgramById(eventId).flatMap(event => {
                            if (resp.programs[0] && event) {
                                return Future.success(
                                    mapProgramToQuestionnaire(
                                        resp.programs[0],
                                        event,
                                        undefined,
                                        programDataElements,
                                        dataElementsWithSortOrder,
                                        sortedOptions,
                                        resp.programStages,
                                        resp.programStageSections,
                                        sortedTrackedentityAttr,
                                        resp.programRules,
                                        resp.programRuleVariables,
                                        resp.programRuleActions
                                    )
                                );
                            } else {
                                return Future.error(new Error("Event Program not found"));
                            }
                        });
                    }
                }
                //return empty form
                else {
                    return Future.success(
                        mapProgramToQuestionnaire(
                            resp.programs[0],
                            undefined,
                            undefined,
                            programDataElements,
                            dataElementsWithSortOrder,
                            sortedOptions,
                            resp.programStages,
                            resp.programStageSections,
                            sortedTrackedentityAttr,
                            resp.programRules,
                            resp.programRuleVariables,
                            resp.programRuleActions
                        )
                    );
                }
            } else {
                return Future.error(new Error("Event Program not found"));
            }
        });
    }

    saveFormData(
        questionnaire: Questionnaire,
        action: ImportStrategy,
        orgUnitId: Id,
        eventId: string | undefined,
        programId: Id
    ): FutureData<Id> {
        const $payload = isTrackerProgram(programId)
            ? mapQuestionnaireToTrackedEntities(questionnaire, orgUnitId, programId, eventId)
            : mapQuestionnaireToEvent(questionnaire, orgUnitId, programId, this.api, eventId);

        return $payload.flatMap(payload => {
            return apiToFuture(this.api.tracker.post({ importStrategy: action }, payload)).flatMap(
                response => {
                    if (response && response.status !== "ERROR") {
                        //return the saved survey id.

                        const surveyId = isTrackerProgram(programId)
                            ? response.bundleReport?.typeReportMap?.TRACKED_ENTITY?.objectReports[0]
                                  ?.uid
                            : response.bundleReport?.typeReportMap?.EVENT?.objectReports[0]?.uid;
                        if (surveyId) return Future.success(surveyId);
                        else return Future.error(new Error(`Error saving survey`));
                    } else {
                        return this.getErrorMessageWithNames(response).flatMap(errorMessage => {
                            return Future.error(new Error(`Error: ${errorMessage} `));
                        });
                    }
                }
            );
        });
    }

    getSurveys(options: {
        surveyFormType: SURVEY_FORM_TYPES;
        programId: Id;
        parentId?: Id;
        orgUnitId: Id;
        chunked: boolean;
    }): FutureData<Survey[]> {
        const { surveyFormType, programId, parentId, orgUnitId, chunked = false } = options;
        const filter = this.getFilterByParentId(programId, parentId);

        return isTrackerProgram(programId)
            ? this.getTrackerProgramSurveys(surveyFormType, programId, orgUnitId, chunked, filter)
            : this.getEventProgramSurveys(surveyFormType, programId, orgUnitId, filter);
    }

    private getFilterByParentId(programId: string, parentId: Maybe<string>): Maybe<Filter> {
        const filterParentDEId = getParentDataElementForProgram(programId);

        const filter =
            parentId && filterParentDEId
                ? {
                      id: filterParentDEId,
                      value: parentId,
                  }
                : undefined;

        return filter;
    }

    private getTrackerProgramSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id,
        chunked = false,
        filter: Maybe<Filter>
    ): FutureData<Survey[]> {
        return chunked
            ? this.getTrackerProgramSurveysChunked(surveyFormType, programId, orgUnitId, filter)
            : this.getTrackerProgramSurveysUnchunked(surveyFormType, programId, orgUnitId, filter);
    }

    private getTrackerProgramSurveysUnchunked(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id,
        filter: Maybe<Filter>
    ): FutureData<Survey[]> {
        const ouMode =
            (orgUnitId !== "" && programId === PREVALENCE_FACILITY_LEVEL_FORM_ID) ||
            programId === PPS_PATIENT_REGISTER_ID
                ? "DESCENDANTS"
                : "SELECTED";

        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: trackedEntityFields,
                program: programId,
                orgUnit: orgUnitId,
                ouMode: ouMode,
                filter: filter ? `${filter.id}:eq:${filter.value}` : undefined,
            })
        ).flatMap((trackedEntities: TrackedEntitiesGetResponse<typeof trackedEntityFields>) => {
            const instances: D2TrackerEntitySelectedPick[] = trackedEntities.instances;
            return this.getOrgUnitsBasicInfo(instances.map(instance => instance.orgUnit)).flatMap(
                orgUnits => {
                    const surveys = mapTrackedEntityToSurvey(instances, surveyFormType, orgUnits);
                    return Future.success(surveys);
                }
            );
        });
    }

    private getTrackerProgramSurveysChunked(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnits: string,
        filter: Maybe<Filter>
    ): FutureData<Survey[]> {
        const orgUnitIds = orgUnits.split(";");
        const chunkedOUs = _(orgUnitIds).chunk(OU_CHUNK_SIZE).value();

        return Future.sequential(
            chunkedOUs.flatMap(ouChunk => {
                return apiToFuture(
                    this.api.tracker.trackedEntities.get({
                        fields: trackedEntityFields,
                        program: programId,
                        orgUnit: ouChunk.join(";"),
                        ouMode: "SELECTED",
                        filter: filter ? `${filter.id}:eq:${filter.value}` : undefined,
                    })
                ).flatMap(
                    (trackedEntities: TrackedEntitiesGetResponse<typeof trackedEntityFields>) => {
                        const instances: D2TrackerEntitySelectedPick[] = trackedEntities.instances;
                        return this.getOrgUnitsBasicInfo(
                            instances.map(instance => instance.orgUnit)
                        ).flatMap(orgUnits => {
                            const surveys = mapTrackedEntityToSurvey(
                                instances,
                                surveyFormType,
                                orgUnits
                            );
                            return Future.success(surveys);
                        });
                    }
                );
            })
        ).flatMap(listOfSurveys => Future.success(_(listOfSurveys).flatten().value()));
    }

    private getOrgUnitsBasicInfo(orgUnitIds: Id[]): FutureData<OrgUnitBasic[]> {
        return apiToFuture(
            this.api.models.organisationUnits.get({
                fields: { id: true, name: true, code: true },
                filter: { id: { in: orgUnitIds } },
                paging: false,
            })
        ).flatMap(orgUnitsResponse => {
            const orgUnits = orgUnitsResponse.objects.map(ou => {
                return { id: ou.id, name: ou.name, code: ou.code };
            });
            return Future.success(orgUnits);
        });
    }

    private getEventProgramSurveys(
        surveyFormType: SURVEY_FORM_TYPES,
        programId: Id,
        orgUnitId: Id,
        filter: Maybe<Filter>
    ): FutureData<Survey[]> {
        const ouMode =
            orgUnitId !== "" &&
            (programId === PPS_WARD_REGISTER_ID ||
                programId === PPS_HOSPITAL_FORM_ID ||
                programId === PPS_COUNTRY_QUESTIONNAIRE_ID ||
                programId === PREVALENCE_SURVEY_FORM_ID)
                ? "DESCENDANTS"
                : "SELECTED";

        return apiToFuture(
            this.api.tracker.events.get({
                fields: { $all: true },
                program: programId,
                orgUnit: orgUnitId,
                ouMode: ouMode,
                filter: filter ? `${filter.id}:eq:${filter.value}` : undefined,
            })
        ).flatMap(response => {
            const events = response.instances;

            return this.getOrgUnitsBasicInfo(events.map(event => event.orgUnit)).flatMap(
                orgUnits => {
                    const surveys = mapEventToSurvey(events, surveyFormType, programId, orgUnits);
                    return Future.success(surveys);
                }
            );
        });
    }

    getPopulatedSurveyById(
        eventId: Id,
        programId: Id,
        orgUnitId: Id | undefined
    ): FutureData<Questionnaire> {
        if (isTrackerProgram(programId) && !orgUnitId && programId !== PPS_PATIENT_REGISTER_ID)
            return Future.error(new Error("Unable to find survey"));
        return this.getForm(programId, eventId, orgUnitId);
    }

    private getEventProgramById(eventId: Id): FutureData<D2TrackerEvent | void> {
        return apiToFuture(
            this.api.tracker.events.getById(eventId, {
                fields: { $all: true },
            })
        ).flatMap(resp => {
            if (resp) return Future.success(resp);
            else return Future.success(undefined);
        });
    }

    private getTrackerProgramById(
        trackedEntityId: Id,
        programId: Id
    ): FutureData<D2TrackerTrackedEntity | void> {
        return apiToFuture(
            this.api.tracker.trackedEntities.get({
                fields: { $all: true },
                program: programId,
                trackedEntity: trackedEntityId,
                ouMode: "ALL",
                enrollmentEnrolledBefore: new Date().toISOString(),
            })
        ).flatMap(trackedEntities => {
            const instances = trackedEntities.instances;

            if (instances[0]) {
                const instance: D2TrackerTrackedEntity = instances[0];
                return Future.success(instance);
            } else return Future.success(undefined);
        });
    }

    getSurveyNameAndASTGuidelineFromId(
        id: Id,
        surveyFormType: SURVEY_FORM_TYPES
    ): FutureData<{ name: string; astGuidelineType?: ASTGUIDELINE_TYPES }> {
        const parentSurveyType = getSurveyType(surveyFormType);

        return this.getEventProgramById(id)
            .flatMap(survey => {
                if (survey) {
                    if (parentSurveyType === "PPS") {
                        const ppsSurveyName = survey.dataValues?.find(
                            dv => dv.dataElement === SURVEY_NAME_DATAELEMENT_ID
                        )?.value;
                        return Future.success({ name: ppsSurveyName ?? "" });
                    } else {
                        const prevalenceSurveyName = survey.dataValues?.find(
                            dv => dv.dataElement === PREVALENCE_SURVEY_NAME_DATAELEMENT_ID
                        )?.value;
                        const customASTGuideline = survey.dataValues?.find(
                            dv => dv.dataElement === AMR_SURVEYS_PREVALENCE_DEA_CUSTOM_AST_GUIDE
                        )?.value;

                        const astGuidelineType = survey.dataValues?.find(
                            dv => dv.dataElement === AMR_SURVEYS_PREVALENCE_DEA_AST_GUIDELINES
                        )?.value;

                        return Future.success({
                            name: prevalenceSurveyName ?? "",
                            astGuidelineType: !customASTGuideline
                                ? astGuidelineType === "CLSI"
                                    ? "CLSI"
                                    : astGuidelineType === "EUCAST"
                                    ? "EUCAST"
                                    : undefined
                                : "CUSTOM",
                        });
                    }
                } else return Future.success({ name: "" });
            })
            .flatMapError(_err => Future.success({ name: "" }));
    }

    getNonPaginatedSurveyChildCount(
        parentProgram: Id,
        orgUnitId: Id,
        parentSurveyId: Id,
        secondaryparentId: Id | undefined
    ): FutureData<ChildCount> {
        return getSurveyChildCount(
            parentProgram,
            orgUnitId,
            parentSurveyId,
            secondaryparentId,
            this.api
        );
    }

    deleteSurvey(id: Id, orgUnitId: Id, programId: Id): FutureData<void> {
        if (isTrackerProgram(programId)) {
            return this.deleteTrackerProgramSurvey(id, orgUnitId, programId);
        } else return this.deleteEventSurvey(id, orgUnitId, programId);
    }

    deleteEventSurvey(eventId: Id, orgUnitId: Id, programId: Id): FutureData<void> {
        const event: D2TrackerEventToPost = {
            event: eventId,
            orgUnit: orgUnitId,
            program: programId,
            // status doesn't play a part in deleting but is required
            status: "ACTIVE",
            occurredAt: "",
            dataValues: [],
            programStage: "",
        };

        const payload: TrackerPostRequest = {
            events: [event],
        };
        return apiToFuture(
            this.api.tracker.postAsync({ importStrategy: "DELETE" }, payload)
        ).flatMap(response => {
            return apiToFuture(
                // eslint-disable-next-line testing-library/await-async-utils
                this.api.system.waitFor("TRACKER_IMPORT_JOB", response.response.id)
            ).flatMap(result => {
                if (result && result.status !== "ERROR") {
                    return Future.success(undefined);
                } else {
                    return this.getErrorMessageWithNames(result).flatMap(errorMessage => {
                        return Future.error(new Error(`Error: ${errorMessage} `));
                    });
                }
            });
        });
    }

    deleteTrackerProgramSurvey(teiId: Id, orgUnitId: Id, programId: Id): FutureData<void> {
        const trackedEntity: D2TrackedEntityInstanceToPost = {
            orgUnit: orgUnitId,
            trackedEntity: teiId,
            trackedEntityType: getTrackedEntityAttributeType(programId),
            enrollments: [],
            attributes: [],
        };

        const payload: TrackerPostRequest = {
            trackedEntities: [trackedEntity],
        };

        return apiToFuture(
            this.api.tracker.postAsync({ importStrategy: "DELETE" }, payload)
        ).flatMap(response => {
            return apiToFuture(
                // eslint-disable-next-line testing-library/await-async-utils
                this.api.system.waitFor("TRACKER_IMPORT_JOB", response.response.id)
            ).flatMap(result => {
                if (result && result.status !== "ERROR") {
                    return Future.success(undefined);
                } else {
                    return this.getErrorMessageWithNames(result).flatMap(errorMessage => {
                        return Future.error(new Error(`Error: ${errorMessage} `));
                    });
                }
            });
        });
    }

    private getErrorMessageWithNames(result: TrackerPostResponse | null): FutureData<string> {
        if (!result) return Future.success("");

        //All possible values where DHIS would populate error messages.
        //So far, DHIS only populates one of them.

        const errMsg =
            result.validationReport?.warningReports[0]?.message ||
            result.validationReport?.errorReports[0]?.message ||
            result.message;

        let errorMessageWithNames = errMsg;

        //DataElement: `{dataElementId}`
        const dataElementPattern = /(?<=DataElement(:*) )`([A-Za-z0-9]{11})`/g;
        const dataelementIds = dataElementPattern.exec(errMsg);

        //Program: `{programId}`
        const programPattern = /(?<=Program(:*) )`([A-Za-z0-9]{11})`/g;
        const programIds = programPattern.exec(errMsg);

        //OrgUnit: `{orgUnitId}`
        const orgUnitPattern = /(?<=OrganisationUnit(:*) )`([A-Za-z0-9]{11})`/g;
        const orgUnitIds = orgUnitPattern.exec(errMsg);

        //Attribute: `{attributeId}`
        const teaPattern = /(?<=attribute(:*) )`([A-Za-z0-9]{11})`/g;
        const teaIds = teaPattern.exec(errMsg);

        //User: `{userId}`
        const userPattern = /(?<=User(:*) )`([A-Za-z0-9]{11})`/g;
        const userIds = userPattern.exec(errMsg);

        return this.fetchNames({
            dataElementId: dataelementIds?.[2],
            programId: programIds?.[2],
            orgUnitId: orgUnitIds?.[2],
            teaId: teaIds?.[2],
        }).flatMap(({ dataElementName, programName, orgUnitName, teaName }) => {
            if (dataelementIds && dataelementIds[2] && dataElementName) {
                errorMessageWithNames = this.parseErrorMessage(
                    errorMessageWithNames,
                    dataelementIds[2],
                    dataElementName
                );
            }

            if (programIds && programIds[2] && programName) {
                errorMessageWithNames = this.parseErrorMessage(
                    errorMessageWithNames,
                    programIds[2],
                    programName
                );
            }

            if (orgUnitIds && orgUnitIds[2] && orgUnitName) {
                errorMessageWithNames = this.parseErrorMessage(
                    errorMessageWithNames,
                    orgUnitIds[2],
                    orgUnitName
                );
            }
            if (teaIds && teaIds[2] && teaName) {
                errorMessageWithNames = this.parseErrorMessage(
                    errorMessageWithNames,
                    teaIds[2],
                    teaName
                );
            }

            if (userIds && userIds[2]) {
                errorMessageWithNames = this.parseErrorMessage(
                    errorMessageWithNames,
                    userIds[2],
                    "This User"
                );
            }

            return Future.success(errorMessageWithNames);
        });
    }

    private parseErrorMessage = (errMsg: string, id: string, name: string): string => {
        return (
            errMsg.slice(0, errMsg.indexOf(id) - 1) +
            `${name} ` +
            errMsg.slice(errMsg.indexOf(id) - 1)
        );
    };

    private fetchNames = ({
        dataElementId,
        programId,
        orgUnitId,
        teaId,
    }: {
        dataElementId?: Id;
        programId?: Id;
        orgUnitId?: Id;
        teaId?: Id;
    }): FutureData<{
        dataElementName?: string;
        programName?: string;
        orgUnitName?: string;
        teaName?: string;
    }> => {
        if (!dataElementId && !programId && !orgUnitId && !teaId) return Future.success({});

        return apiToFuture(
            this.api.metadata
                .get({
                    ...(dataElementId && {
                        dataElements: {
                            fields: { shortName: true },
                            filter: { id: { eq: dataElementId } },
                        },
                    }),
                    ...(programId && {
                        programs: {
                            fields: { shortName: true },
                            filter: { id: { eq: programId } },
                        },
                    }),
                    ...(orgUnitId && {
                        organisationUnits: {
                            fields: { shortName: true },
                            filter: { id: { eq: orgUnitId } },
                        },
                    }),
                    ...(teaId && {
                        trackedEntityAttributes: {
                            fields: { shortName: true },
                            filter: { id: { eq: teaId } },
                        },
                    }),
                })
                .map(response => {
                    const fetchedNames: {
                        dataElementName?: string;
                        programName?: string;
                        orgUnitName?: string;
                        teaName?: string;
                    } = {};
                    if (response?.data?.dataElements) {
                        fetchedNames.dataElementName = `${response.data.dataElements?.[0]?.shortName}`;
                    }
                    if (response?.data?.programs) {
                        fetchedNames.programName = `${response.data.programs?.[0]?.shortName}`;
                    }
                    if (response?.data?.organisationUnits) {
                        fetchedNames.orgUnitName = `${response.data.organisationUnits?.[0]?.shortName}`;
                    }
                    if (response?.data?.trackedEntityAttributes) {
                        fetchedNames.teaName = `${response.data.trackedEntityAttributes?.[0]?.shortName}`;
                    }
                    return fetchedNames;
                })
        );
    };
}
