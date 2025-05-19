import { ModuleRepository } from "../../repositories/ModuleRepository";
import { mock, instance, when } from "ts-mockito";
import { Future } from "../../entities/generic/Future";
import { AMRSurveyModule, ModuleName } from "../../entities/AMRSurveyModule";
import { getDefaultOrCustomProgramId } from "../getDefaultOrCustomProgramId";
import { PREVALENCE_CASE_REPORT_FORM_ID } from "../../../data/entities/D2Survey";

const parentSurveyId = "parentSurveyId";
const customProgramId = "customProgramId";

describe("getDefaultOrCustomProgramId", () => {
    describe("when the module has custom forms", () => {
        it("should return custom program for PrevalenceCaseReportForm type", async () => {
            const moduleRepository = givenAModuleWithCustomForms(
                "Prevalence",
                parentSurveyId,
                PREVALENCE_CASE_REPORT_FORM_ID,
                customProgramId
            );

            const programIdResponse = await getDefaultOrCustomProgramId(
                moduleRepository,
                "PrevalenceCaseReportForm",
                parentSurveyId
            ).toPromise();

            expect(programIdResponse).toBe(customProgramId);
        });
    });

    describe("when the module has no custom forms", () => {
        it("should return default program for PrevalenceCaseReportForm type", async () => {
            const moduleRepository = givenAModuleWithoutCustomForms();

            const programIdResponse = await getDefaultOrCustomProgramId(
                moduleRepository,
                "PrevalenceCaseReportForm",
                parentSurveyId
            ).toPromise();

            expect(programIdResponse).toBe(PREVALENCE_CASE_REPORT_FORM_ID);
        });
    });
});

function givenAModuleWithoutCustomForms(): ModuleRepository {
    const amrModules = givenAnARMModules();

    const mockedModuleRepository = mock<ModuleRepository>();
    when(mockedModuleRepository.getAll()).thenReturn(Future.success(amrModules));

    return instance(mockedModuleRepository);
}

function givenAModuleWithCustomForms(
    module: ModuleName,
    parentSurveyId: string,
    defaultProgramId: string,
    customProgramId: string
): ModuleRepository {
    const amrModules = givenAnARMModules();

    const amrModulesWithCustomForms = amrModules.map(moduleItem => {
        if (moduleItem.name === module) {
            return {
                ...moduleItem,
                customForms: { [parentSurveyId]: { [defaultProgramId]: customProgramId } },
            };
        }
        return moduleItem;
    });

    const mockedModuleRepository = mock<ModuleRepository>();
    when(mockedModuleRepository.getAll()).thenReturn(Future.success(amrModulesWithCustomForms));

    return instance(mockedModuleRepository);
}

function givenAnARMModules(): AMRSurveyModule[] {
    return [
        {
            color: "#A6228F",
            id: "QaxWuRg4XAL",
            name: "PPS",
            surveyPrograms: [
                {
                    id: "OGOw5Kt3ytv",
                    name: "PPS Survey Form",
                },
                {
                    id: "mesnCzaLc7u",
                    name: "PPS Hospital form",
                },
            ],
            rulesBySurvey: [],
            userGroups: {
                adminAccess: [
                    {
                        id: "vnvKgXEe9pp",
                        name: "AMR Surveys PPS admin",
                    },
                ],
                captureAccess: [
                    {
                        id: "xRM5fExpVYi",
                        name: "AMR Surveys PPS data capture",
                    },
                ],
                readAccess: [
                    {
                        id: "BwXHH1ztfgC",
                        name: "AMR Surveys PPS data visualizer",
                    },
                ],
            },
        },
        {
            color: "#E23A75",
            id: "cBqBNvIJTlX",
            name: "Prevalence",
            rulesBySurvey: [],
            surveyPrograms: [
                {
                    id: "WcSw803XiUk",
                    name: "Survey form",
                },
            ],
            userGroups: {
                adminAccess: [
                    {
                        id: "p9FsjQ18CX6",
                        name: "AMR Surveys Prevalence admin",
                    },
                ],
                captureAccess: [
                    {
                        id: "mEiddV7XYz5",
                        name: "AMR Surveys Prevalence data capture",
                    },
                ],
                readAccess: [
                    {
                        id: "UVrRpSXkVfH",
                        name: "AMR Surveys Prevalence data visualizer",
                    },
                ],
            },
        },
    ];
}
