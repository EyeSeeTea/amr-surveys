import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";
import { SurveyRepository } from "../repositories/SurveyRepository";
import _ from "../entities/generic/Collection";
import {
    PREVALENCE_CASE_REPORT_FORM_ID,
    PREVALENCE_CENTRAL_REF_LAB_FORM_ID,
    PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID,
    PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID,
    PREVALENCE_SUPRANATIONAL_REF_LAB_ID,
} from "../../data/repositories/SurveyFormD2Repository";

export class GetMultipleSurveysUseCase {
    constructor(private surveyReporsitory: SurveyRepository) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        rootSurveyId: Id | undefined
    ): FutureData<Survey[]> {
        return Future.joinObj({
            caseReportSurveys: this.surveyReporsitory.getSurveys(
                surveyFormType,
                PREVALENCE_CASE_REPORT_FORM_ID,
                orgUnitId,
                undefined,
                -1,
                -1
            ),
            sampleShipmentSurveys: this.surveyReporsitory.getSurveys(
                surveyFormType,
                PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID,
                orgUnitId,
                undefined,
                -1,
                -1
            ),

            centralRefLabSurveys: this.surveyReporsitory.getSurveys(
                surveyFormType,
                PREVALENCE_CENTRAL_REF_LAB_FORM_ID,
                orgUnitId,
                undefined,
                -1,
                -1
            ),

            pathogenIsolatesSurveys: this.surveyReporsitory.getSurveys(
                surveyFormType,
                PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID,
                orgUnitId,
                undefined,
                -1,
                -1
            ),

            supranationalRefSurveys: this.surveyReporsitory.getSurveys(
                surveyFormType,
                PREVALENCE_SUPRANATIONAL_REF_LAB_ID,
                orgUnitId,
                undefined,
                -1,
                -1
            ),
        }).map(
            ({
                caseReportSurveys,
                sampleShipmentSurveys,
                centralRefLabSurveys,
                pathogenIsolatesSurveys,
                supranationalRefSurveys,
            }) => {
                return [
                    ...caseReportSurveys.objects,
                    ...sampleShipmentSurveys.objects,
                    ...centralRefLabSurveys.objects,
                    ...pathogenIsolatesSurveys.objects,
                    ...supranationalRefSurveys.objects,
                ].filter(survey => survey.rootSurvey.id === rootSurveyId);
            }
        );
    }
}
