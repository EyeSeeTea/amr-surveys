import { FutureData } from "../../data/api-futures";
import { Questionnaire } from "../entities/Questionnaire/Questionnaire";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import _ from "../../domain/entities/generic/Collection";
import { Id } from "../entities/Ref";
import { Future } from "../entities/generic/Future";
import {
    AMR_SURVEYS_PREVALENCE_DEA_AST_GUIDELINES,
    AMR_SURVEYS_PREVALENCE_DEA_CUSTOM_AST_GUIDE,
} from "../../data/entities/D2Survey";
import { ASTGUIDELINE_TYPES } from "../entities/ASTGuidelines";
import { SelectQuestion } from "../entities/Questionnaire/QuestionnaireQuestion";
import { ASTGuidelinesRepository } from "../repositories/ASTGuidelinesRepository";
import i18n from "../../utils/i18n";

export const GLOBAL_OU_ID = "H8RixfF8ugH";
export class SaveFormDataUseCase {
    constructor(
        private surveyRepository: SurveyRepository,
        private astGuidelineRepository: ASTGuidelinesRepository
    ) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        questionnaire: Questionnaire,
        orgUnitId: Id,
        eventId: string | undefined = undefined
    ): FutureData<Id> {
        //All PPS Survey Forms are Global.
        const ouId =
            surveyFormType === "PPSSurveyForm" && orgUnitId === "" ? GLOBAL_OU_ID : orgUnitId;

        return this.validate(
            surveyFormType,
            questionnaire,
            ouId,
            questionnaire.id,
            eventId
        ).flatMap(() =>
            this.saveFormData(surveyFormType, questionnaire, ouId, questionnaire.id, eventId)
        );
    }

    validate = (
        surveyFormType: SURVEY_FORM_TYPES,
        questionnaire: Questionnaire,
        orgUnitId: Id,
        programId: Id,
        eventId: string | undefined = undefined
    ): FutureData<boolean> => {
        const isNew = !eventId;
        if (
            isNew &&
            (surveyFormType === "PrevalenceFacilityLevelForm" ||
                surveyFormType === "PPSHospitalForm" ||
                surveyFormType === "PPSCountryQuestionnaire")
        ) {
            // avoid duplicate orgUnit in the same parent survey (Facility Level and Hospital)
            const surveyId = questionnaire.getParentSurveyId();
            if (!surveyId) {
                return Future.error(
                    new Error(i18n.t("Survey ID expected but could not be resolved"))
                );
            }
            return this.surveyRepository
                .getSurveys({
                    surveyFormType: surveyFormType,
                    programId: programId,
                    orgUnitId: orgUnitId,
                    chunked: false,
                    parentId: surveyId,
                })
                .flatMap(surveys => {
                    if (surveys.length > 0) {
                        const errorMessages = {
                            PrevalenceFacilityLevelForm: i18n.t(
                                "Prevalence Facility already exists for this Survey."
                            ),
                            PPSHospitalForm: i18n.t("Hospital already exists for this Survey"),
                            PPSCountryQuestionnaire: i18n.t(
                                "Country already exist for this Survey"
                            ),
                        };
                        return Future.error(new Error(errorMessages[surveyFormType]));
                    } else return Future.success(true);
                });
        }
        return Future.success(true);
    };

    saveFormData = (
        surveyFormType: SURVEY_FORM_TYPES,
        questionnaire: Questionnaire,
        ouId: string,
        programId: string,
        eventId: string | undefined = undefined
    ): FutureData<Id> => {
        return this.surveyRepository
            .saveFormData(questionnaire, "CREATE_AND_UPDATE", ouId, eventId, programId)
            .flatMap(surveyId => {
                return this.saveCustomASTGuidelineToDatastore(
                    surveyId,
                    questionnaire,
                    surveyFormType
                );
            });
    };

    saveCustomASTGuidelineToDatastore = (
        surveyId: Id,
        questionnaire: Questionnaire,
        surveyFormType: SURVEY_FORM_TYPES
    ): FutureData<Id> => {
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
                        return Future.success(surveyId);
                    });
            }
        }
        return Future.success(surveyId);
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
