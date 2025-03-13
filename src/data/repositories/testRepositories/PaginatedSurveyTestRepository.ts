import { Future } from "../../../domain/entities/generic/Future";
import { Id } from "../../../domain/entities/Ref";
import {
    ChildCount,
    SURVEY_FORM_TYPES,
    SURVEY_TYPES,
    Survey,
} from "../../../domain/entities/Survey";
import { PaginatedReponse, SortColumnDetails } from "../../../domain/entities/TablePagination";
import { PaginatedSurveyRepository } from "../../../domain/repositories/PaginatedSurveyRepository";
import { FutureData } from "../../api-futures";

export class PaginatedSurveyTestRepository implements PaginatedSurveyRepository {
    getFilteredPPSSurveys(
        orgUnitId: Id,
        surveyType: SURVEY_TYPES,
        page: number,
        pageSize: number,
        _sortColumnDetails?: SortColumnDetails
    ): FutureData<PaginatedReponse<Survey[]>> {
        return Future.success({
            pager: {
                page: page,
                pageSize: pageSize,
            },
            objects: [
                {
                    name: "Patient1",
                    id: "1",
                    startDate: new Date(),
                    status: "ACTIVE",
                    assignedOrgUnit: { id: orgUnitId, name: "OU1", code: "OU1" },
                    surveyType: surveyType,
                    rootSurvey: { id: "1", name: `1`, surveyType: "" },
                    surveyFormType: "PPSSurveyForm",
                },
                {
                    name: "Patient2",
                    id: "2",
                    startDate: new Date(),
                    status: "COMPLETED",
                    assignedOrgUnit: { id: "OU1234", name: "OU2", code: "OU2" },
                    surveyType: surveyType,
                    rootSurvey: { id: "2", name: `2`, surveyType: "" },
                    surveyFormType: "PPSSurveyForm",
                },
            ],
        });
    }
    getFilteredPrevalencePatientSurveysByPatientId(
        keyword: string,
        orgUnitId: string,
        parentId: string
    ): FutureData<PaginatedReponse<Survey[]>> {
        return Future.success({
            pager: {
                page: 1,
                pageSize: 10,
            },
            objects: [
                {
                    name: "Patient1",
                    id: "1",
                    startDate: new Date(),
                    status: "ACTIVE",
                    assignedOrgUnit: { id: orgUnitId, name: "OU1", code: "OU1" },
                    surveyType: "",
                    rootSurvey: { id: parentId, name: `${keyword}-1`, surveyType: "" },
                    surveyFormType: "PrevalenceCaseReportForm",
                },
                {
                    name: "Patient2",
                    id: "2",
                    startDate: new Date(),
                    status: "COMPLETED",
                    assignedOrgUnit: { id: "OU1234", name: "OU2", code: "OU2" },
                    surveyType: "",
                    rootSurvey: { id: parentId, name: `${keyword}-1`, surveyType: "" },
                    surveyFormType: "PrevalenceCaseReportForm",
                },
            ],
        });
    }
    getFilteredPPSPatientByPatientCodeSurveys(
        keyword: string,
        orgUnitId: string,
        parentId: string
    ): FutureData<PaginatedReponse<Survey[]>> {
        return Future.success({
            pager: {
                page: 1,
                pageSize: 10,
            },
            objects: [
                {
                    name: "Patient1",
                    id: "1",
                    startDate: new Date(),
                    status: "ACTIVE",
                    assignedOrgUnit: { id: orgUnitId, name: "OU1", code: "OU1" },
                    surveyType: "",
                    rootSurvey: { id: parentId, name: `${keyword}-1`, surveyType: "" },
                    surveyFormType: "PrevalenceCaseReportForm",
                },
                {
                    name: "Patient2",
                    id: "2",
                    startDate: new Date(),
                    status: "COMPLETED",
                    assignedOrgUnit: { id: "OU1234", name: "OU2", code: "OU2" },
                    surveyType: "",
                    rootSurvey: { id: parentId, name: `${keyword}-1`, surveyType: "" },
                    surveyFormType: "PrevalenceCaseReportForm",
                },
            ],
        });
    }
    getFilteredPPSPatientByPatientIdSurveys(
        keyword: string,
        orgUnitId: string
    ): FutureData<PaginatedReponse<Survey[]>> {
        return Future.success({
            pager: {
                page: 1,
                pageSize: 10,
            },
            objects: [
                {
                    name: "Patient1",
                    id: "1",
                    startDate: new Date(),
                    status: "ACTIVE",
                    assignedOrgUnit: { id: orgUnitId, name: "OU1", code: "OU1" },
                    surveyType: "",
                    rootSurvey: { id: "1", name: `${keyword}-1`, surveyType: "" },
                    surveyFormType: "PrevalenceCaseReportForm",
                },
                {
                    name: "Patient2",
                    id: "2",
                    startDate: new Date(),
                    status: "COMPLETED",
                    assignedOrgUnit: { id: "OU1234", name: "OU2", code: "OU2" },
                    surveyType: "",
                    rootSurvey: { id: "2", name: `${keyword}-1`, surveyType: "" },
                    surveyFormType: "PrevalenceCaseReportForm",
                },
            ],
        });
    }
    getSurveys(
        options: {
            surveyFormType: SURVEY_FORM_TYPES;
            programId: string;
            orgUnitId: string;
            parentId: string | undefined;
            page: number;
            pageSize: number;
        },
        _chunked: boolean
    ): FutureData<PaginatedReponse<Survey[]>> {
        const { orgUnitId, page, pageSize, surveyFormType } = options;
        return Future.success({
            pager: {
                page: page,
                pageSize: pageSize,
            },
            objects: [
                {
                    name: "Patient1",
                    id: "1",
                    startDate: new Date(),
                    status: "ACTIVE",
                    assignedOrgUnit: { id: orgUnitId, name: "OU1", code: "OU1" },
                    surveyType: "",
                    rootSurvey: { id: "1", name: `S-1`, surveyType: "" },
                    surveyFormType: surveyFormType,
                },
                {
                    name: "Patient2",
                    id: "2",
                    startDate: new Date(),
                    status: "COMPLETED",
                    assignedOrgUnit: { id: "OU1234", name: "OU2", code: "OU2" },
                    surveyType: "",
                    rootSurvey: { id: "2", name: `S-2`, surveyType: "" },
                    surveyFormType: surveyFormType,
                },
            ],
        });
    }
    getPaginatedSurveyChildCount(
        _parentProgram: string,
        _orgUnitId: string,
        _parentSurveyId: string,
        _secondaryparentId: string | undefined
    ): FutureData<ChildCount> {
        return Future.success({ type: "number", value: 2 });
    }
}
