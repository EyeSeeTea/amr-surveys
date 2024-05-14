import { FutureData } from "../../data/api-futures";
import { Questionnaire } from "../entities/Questionnaire/Questionnaire";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import _ from "../../domain/entities/generic/Collection";
import { Id } from "../entities/Ref";
import { getProgramId } from "../utils/PPSProgramsHelper";
import { Future } from "../entities/generic/Future";
import {
    AMR_SURVEYS_PREVALENCE_DEA_AST_GUIDELINES,
    AMR_SURVEYS_PREVALENCE_DEA_CUSTOM_AST_GUIDE,
} from "../../data/entities/D2Survey";
import { ASTGUIDELINE_TYPES } from "../entities/ASTGuidelines";
import { SelectQuestion } from "../entities/Questionnaire/QuestionnaireQuestion";
import { ASTGuidelinesRepository } from "../repositories/ASTGuidelinesRepository";

export const GLOBAL_OU_ID = "H8RixfF8ugH";
export class SaveFormDataUseCase {
    constructor(
        private surveyReporsitory: SurveyRepository,
        private astGuidelineRepository: ASTGuidelinesRepository
    ) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        questionnaire: Questionnaire,
        orgUnitId: Id,
        eventId: string | undefined = undefined
    ): FutureData<void> {
        const programId = getProgramId(surveyFormType);

        //All PPS Survey Forms are Global.
        const ouId =
            surveyFormType === "PPSSurveyForm" && orgUnitId === "" ? GLOBAL_OU_ID : orgUnitId;

        //Do not allow creation of multiple Prevalence Facility Level Forms for the same facility.
        if (surveyFormType === "PrevalenceFacilityLevelForm") {
            return this.surveyReporsitory
                .getSurveys(surveyFormType, programId, ouId, false)
                .flatMap(surveys => {
                    if (surveys.length > 0) {
                        return Future.error(
                            new Error(
                                "Prevalence Facility Level Form already exists for this facility."
                            )
                        );
                    } else
                        return this.saveFormData(
                            surveyFormType,
                            questionnaire,
                            ouId,
                            programId,
                            eventId
                        );
                });
        }

        return this.saveFormData(surveyFormType, questionnaire, ouId, programId, eventId);
    }

    saveFormData = (
        surveyFormType: SURVEY_FORM_TYPES,
        questionnaire: Questionnaire,
        ouId: string,
        programId: string,
        eventId: string | undefined = undefined
    ): FutureData<void> => {
        return this.surveyReporsitory
            .saveFormData(questionnaire, "CREATE_AND_UPDATE", ouId, eventId, programId)
            .flatMap((surveyId: Id | undefined) => {
                if (surveyId) {
                    return this.saveCustomASTGuidelineToDatastore(
                        surveyId,
                        questionnaire,
                        surveyFormType
                    );
                } else {
                    return Future.success(undefined);
                }
            });
    };

    saveCustomASTGuidelineToDatastore = (
        surveyId: Id,
        questionnaire: Questionnaire,
        surveyFormType: SURVEY_FORM_TYPES
    ): FutureData<void> => {
        //If Prevelance Survey Form, of custom AST Guideline, then save custom guideline to datastore.

        const customASTGuidelineQuestion = questionnaire.stages[0]?.sections
            .flatMap(section => section.questions)
            .find(question => question.id === AMR_SURVEYS_PREVALENCE_DEA_CUSTOM_AST_GUIDE);

        if (
            surveyFormType === "PrevalenceSurveyForm" &&
            customASTGuidelineQuestion &&
            customASTGuidelineQuestion.value
        ) {
            const astGuidelineQuestion = questionnaire.stages[0]?.sections
                .flatMap(section => section.questions)
                .find(question => question.id === AMR_SURVEYS_PREVALENCE_DEA_AST_GUIDELINES);
            if (astGuidelineQuestion && astGuidelineQuestion.type === "select") {
                const astGuidelineType = this.getCustomGuidelineType(astGuidelineQuestion);
                return this.astGuidelineRepository
                    .saveByASTGuidelineType(astGuidelineType, surveyId)
                    .flatMap(() => {
                        console.debug("Custom AST Guideline saved successfully.");
                        return Future.success(undefined);
                    });
            }
        }
        return Future.success(undefined);
    };

    getCustomGuidelineType = (astGuidelineQuestion: SelectQuestion): ASTGUIDELINE_TYPES => {
        if (astGuidelineQuestion.value && astGuidelineQuestion.value.code !== "") {
            if (astGuidelineQuestion.value.code === "CLSI") {
                return "CLSI";
            } else {
                return "EUCAST";
            }
        } else {
            return "CUSTOM";
        }
    };
}
