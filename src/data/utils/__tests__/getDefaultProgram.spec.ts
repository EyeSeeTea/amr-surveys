import { PREVALENCE_CASE_REPORT_FORM_ID } from "../../entities/D2Survey";
import { getDefaultProgram } from "../getDefaultProgram";
import { AMRSurveyModule, ModuleName } from "../../../domain/entities/AMRSurveyModule";

const prevalenceParentSurveyId = "prevalenceParentSurveyId";
const ppsParentSurveyId = "ppsParentSurveyId";
const prevanlanceCustomProgramId = "prevanlanceCustomProgramId";

describe("getDefaultProgram", () => {
    describe("when the module has custom forms", () => {
        it("should return default program for custom program if it's the unique customn form by parentSurveyId", async () => {
            const modules = givenAModuleWithCustomForms(
                "Prevalence",
                prevalenceParentSurveyId,
                PREVALENCE_CASE_REPORT_FORM_ID,
                prevanlanceCustomProgramId
            );

            const defaultProgram = getDefaultProgram(prevanlanceCustomProgramId, modules);

            expect(defaultProgram).toBe(PREVALENCE_CASE_REPORT_FORM_ID);
        });
        it("should return default program for custom program if exists previous customn forms by parentSurveyId", async () => {
            const modules = givenAModuleWithCustomForms(
                "Prevalence",
                prevalenceParentSurveyId,
                PREVALENCE_CASE_REPORT_FORM_ID,
                prevanlanceCustomProgramId,
                true
            );

            const defaultProgram = getDefaultProgram(prevanlanceCustomProgramId, modules);

            expect(defaultProgram).toBe(PREVALENCE_CASE_REPORT_FORM_ID);
        });
    });

    describe("when the module has no custom forms", () => {
        it("should return the same program", async () => {
            const modules = givenAModuleWithoutCustomForms();

            const defaultProgram = getDefaultProgram(prevanlanceCustomProgramId, modules);

            expect(defaultProgram).toBe(prevanlanceCustomProgramId);
        });
    });
});

function givenAModuleWithoutCustomForms(): AMRSurveyModule[] {
    return givenAnARMModules();
}

function givenAModuleWithCustomForms(
    module: ModuleName,
    parentSurveyId: string,
    defaultProgramId: string,
    customProgramId: string,
    containsPreviousCustomForms = false
): AMRSurveyModule[] {
    const amrModules = givenAnARMModules();

    const amrModulesWithPreviousCustomForms: AMRSurveyModule[] = addPreviousCustomFormsIfRequired(
        containsPreviousCustomForms,
        amrModules
    );

    const amrModulesWithCustomForms = amrModulesWithPreviousCustomForms.map(moduleItem => {
        if (moduleItem.name === module) {
            return {
                ...moduleItem,
                customForms: {
                    [parentSurveyId]: {
                        ...moduleItem.customForms?.[parentSurveyId],
                        [defaultProgramId]: customProgramId,
                    },
                },
            };
        }
        return moduleItem;
    });

    return amrModulesWithCustomForms;
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

function addPreviousCustomFormsIfRequired(
    containsPreviousCustomForms: boolean,
    amrModules: AMRSurveyModule[]
): AMRSurveyModule[] {
    return containsPreviousCustomForms
        ? amrModules.map(moduleItem => {
              if (moduleItem.name === "Prevalence") {
                  const module = {
                      ...moduleItem,
                      customForms: {
                          [prevalenceParentSurveyId]: {
                              previousPrevalanceDefaultProgramId:
                                  "previousPrevanlanceCustomProgramId",
                          },
                      },
                  };

                  return module;
              } else {
                  const module = {
                      ...moduleItem,
                      customForms: {
                          [ppsParentSurveyId]: {
                              previousPPSDefaultProgramId: "previousPPSCustomProgramId",
                          },
                      },
                  };

                  return module;
              }
          })
        : amrModules;
}
