import { D2Api } from "@eyeseetea/d2-api/2.36";
import { D2TrackerEvent } from "@eyeseetea/d2-api/api/trackerEvents";
import { Future } from "../../domain/entities/generic/Future";
import {
    BooleanQuestion,
    DateQuestion,
    Question,
    Questionnaire,
    SelectQuestion,
    TextQuestion,
} from "../../domain/entities/Questionnaire";
import { Id } from "../../domain/entities/Ref";
import { SurveyRepository } from "../../domain/repositories/SurveyRepository";
import { apiToFuture, FutureData } from "../api-futures";
import _ from "../../domain/entities/generic/Collection";
import {
    EventProgramDataElement,
    EventProgramMetadata,
    ImportStrategy,
    Option,
    TrackerEventsPostRequest,
} from "../../domain/entities/EventProgram";

export class SurveyD2Repository implements SurveyRepository {
    constructor(private api: D2Api) {}

    getForm(programId: Id): FutureData<Questionnaire> {
        return apiToFuture(
            this.api.request<EventProgramMetadata>({
                method: "get",
                url: `/programs/${programId}/metadata.json?fields=programs,dataElements,programStageDataElements,programStageSections`,
            })
        ).flatMap(resp => {
            if (resp.programs[0]) {
                const programDataElements = resp.programStageDataElements.map(
                    psde => psde.dataElement
                );
                //If the EventProgram has sections, fetch and use programStageSections
                const sections = resp.programStageSections
                    ? resp.programStageSections.map(section => {
                          const questions: Question[] = this.mapProgramDataElementToQuestions(
                              section.dataElements,
                              resp.dataElements,
                              resp.options
                          );

                          return {
                              title: section.name,
                              code: section.id,
                              questions: questions,
                              isVisible: true,
                          };
                      })
                    : //If the EventProgram has no sections, create a single section
                      [
                          {
                              title: "Survey Info",
                              code: "",
                              questions: this.mapProgramDataElementToQuestions(
                                  programDataElements,
                                  resp.dataElements,
                                  resp.options
                              ),
                              isVisible: true,
                          },
                      ];
                const form: Questionnaire = {
                    id: resp.programs[0].id,
                    name: resp.programs[0].name,
                    description: resp.programs[0].name,
                    orgUnit: { id: "" },
                    year: "",
                    isCompleted: false,
                    isMandatory: false,
                    rules: [],
                    sections: sections,
                };

                return Future.success(form);
            } else {
                return Future.error(new Error("Event Program not found"));
            }
        });
    }

    private mapProgramDataElementToQuestions(
        sectionDataElements: { id: string }[],
        dataElements: EventProgramDataElement[],
        options: Option[],
        event: D2TrackerEvent | undefined = undefined
    ): Question[] {
        const questions: Question[] = _(
            sectionDataElements.map(dataElement => {
                const curDataEleemnt = dataElements.filter(de => de.id === dataElement.id);

                if (curDataEleemnt[0]) {
                    const dataElement = curDataEleemnt[0];
                    const dataValue = event
                        ? event.dataValues.find(dv => dv.dataElement === dataElement.id)
                        : undefined;
                    switch (dataElement.valueType) {
                        case "BOOLEAN": {
                            const boolQ: BooleanQuestion = {
                                id: dataElement.id,
                                code: dataElement.code, //code
                                text: dataElement.formName, //formName
                                type: "boolean",
                                storeFalse: true,
                                value: dataValue
                                    ? dataValue.value === "true"
                                        ? true
                                        : false
                                    : true,
                            };

                            return boolQ;
                        }

                        case "TEXT": {
                            if (dataElement.optionSet) {
                                const selectOptions = options.filter(
                                    op => op.optionSet.id === dataElement.optionSet?.id
                                );

                                const selectedOption = dataValue
                                    ? selectOptions.find(o => o.code === dataValue.value)
                                    : undefined;

                                const selectQ: SelectQuestion = {
                                    id: dataElement.id || "",
                                    code: dataElement.code || "",
                                    text: dataElement.formName || "",
                                    type: "select",
                                    options: selectOptions,
                                    value: selectedOption
                                        ? selectedOption
                                        : { name: "", id: "", code: "" },
                                };
                                return selectQ;
                            } else {
                                const singleLineText: TextQuestion = {
                                    id: dataElement.id,
                                    code: dataElement.code,
                                    text: dataElement.formName,
                                    type: "text",
                                    value: dataValue ? (dataValue.value as string) : "",
                                    multiline: false,
                                };

                                return singleLineText;
                            }
                        }

                        case "LONG_TEXT": {
                            const singleLineTextQ: TextQuestion = {
                                id: dataElement.id,
                                code: dataElement.code,
                                text: dataElement.formName,
                                type: "text",
                                value: dataValue ? (dataValue.value as string) : "",
                                multiline: true,
                            };

                            return singleLineTextQ;
                        }

                        case "DATE": {
                            const dateQ: DateQuestion = {
                                id: dataElement.id,
                                code: dataElement.code,
                                text: dataElement.formName,
                                type: "date",
                                value: dataValue ? new Date(dataValue.value as string) : new Date(),
                            };

                            return dateQ;
                        }
                    }
                }
            })
        )
            .compact()
            .value();

        return questions;
    }

    saveFormData(events: TrackerEventsPostRequest, action: ImportStrategy): FutureData<void> {
        return apiToFuture(this.api.tracker.postAsync({ importStrategy: action }, events)).flatMap(
            response => {
                return apiToFuture(
                    // eslint-disable-next-line testing-library/await-async-utils
                    this.api.system.waitFor("TRACKER_IMPORT_JOB", response.response.id)
                ).flatMap(result => {
                    if (result) {
                        return Future.success(undefined);
                    } else {
                        return Future.error(new Error("An error occured while saving the survey"));
                    }
                });
            }
        );
    }
}
