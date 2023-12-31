import { FutureData } from "../../data/api-futures";
import { Future } from "../entities/generic/Future";
import { Id } from "../entities/Ref";
import { Survey, SURVEY_FORM_TYPES } from "../entities/Survey";
import _ from "../entities/generic/Collection";
import {
    PREVALENCE_CASE_REPORT_FORM_ID,
    PREVALENCE_CENTRAL_REF_LAB_FORM_ID,
    PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID,
    PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID,
    PREVALENCE_SUPRANATIONAL_REF_LAB_ID,
} from "../../data/repositories/SurveyFormD2Repository";
import { PaginatedReponse } from "../entities/TablePagination";
import { PaginatedSurveyRepository } from "../repositories/PaginatedSurveyRepository";

export class GetAllPrevelancePatientSurveysUseCase {
    constructor(private paginatedSurveyRepo: PaginatedSurveyRepository) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        rootSurveyId: Id | undefined,
        page: number,
        pageSize: number
    ): FutureData<PaginatedReponse<Survey[]>> {
        return Future.joinObj({
            caseReportSurveys: this.paginatedSurveyRepo.getSurveys(
                surveyFormType,
                PREVALENCE_CASE_REPORT_FORM_ID,
                orgUnitId,
                rootSurveyId,
                page,
                pageSize / 5
            ),
            sampleShipmentSurveys: this.paginatedSurveyRepo.getSurveys(
                surveyFormType,
                PREVALENCE_SAMPLE_SHIP_TRACK_FORM_ID,
                orgUnitId,
                rootSurveyId,
                page,
                pageSize / 5
            ),

            centralRefLabSurveys: this.paginatedSurveyRepo.getSurveys(
                surveyFormType,
                PREVALENCE_CENTRAL_REF_LAB_FORM_ID,
                orgUnitId,
                rootSurveyId,
                page,
                pageSize / 5
            ),

            pathogenIsolatesSurveys: this.paginatedSurveyRepo.getSurveys(
                surveyFormType,
                PREVALENCE_PATHOGEN_ISO_STORE_TRACK_ID,
                orgUnitId,
                rootSurveyId,
                page,
                pageSize / 5
            ),

            supranationalRefSurveys: this.paginatedSurveyRepo.getSurveys(
                surveyFormType,
                PREVALENCE_SUPRANATIONAL_REF_LAB_ID,
                orgUnitId,
                rootSurveyId,
                page,
                pageSize / 5
            ),
        }).map(
            ({
                caseReportSurveys,
                sampleShipmentSurveys,
                centralRefLabSurveys,
                pathogenIsolatesSurveys,
                supranationalRefSurveys,
            }) => {
                return {
                    pager: {
                        page: page,
                        pageSize:
                            caseReportSurveys.objects.length +
                            sampleShipmentSurveys.objects.length +
                            centralRefLabSurveys.objects.length +
                            pathogenIsolatesSurveys.objects.length +
                            supranationalRefSurveys.objects.length,
                        total:
                            (caseReportSurveys.pager.total ?? 0) +
                            (sampleShipmentSurveys.pager.total ?? 0) +
                            (centralRefLabSurveys.pager.total ?? 0) +
                            (pathogenIsolatesSurveys.pager.total ?? 0) +
                            (supranationalRefSurveys.pager.total ?? 0),
                    },
                    objects: [
                        ...caseReportSurveys.objects,
                        ...sampleShipmentSurveys.objects,
                        ...centralRefLabSurveys.objects,
                        ...pathogenIsolatesSurveys.objects,
                        ...supranationalRefSurveys.objects,
                    ],
                };
            }
        );
    }
}
