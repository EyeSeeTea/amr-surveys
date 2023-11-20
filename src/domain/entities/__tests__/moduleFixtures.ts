import { AMRSurveyModule } from "../AMRSurveyModule";

export function createModuleList(): AMRSurveyModule[] {
    return [
        {
            color: "#A6228F",
            id: "ER1eGzQetqt",
            name: "PPS",
            surveyPrograms: [
                {
                    id: "Kimo6Gb1Lxu",
                    name: "PPS Hospital Form",
                },

                {
                    id: "iwwz8Xssua2",
                    name: "PPS Survey Form",
                },
            ],
            userGroups: {
                captureAccess: [
                    {
                        id: "1",
                        name: "pps-capture-ug",
                    },
                ],
                readAccess: [
                    {
                        id: "2",
                        name: "pps-read-ug",
                    },
                ],
                adminAccess: [
                    {
                        id: "3",
                        name: "pps-admin-ug",
                    },
                ],
            },
        },
        {
            color: "#E23A75",
            id: "BwJDlAxZTOj",
            name: "Prevalence",
            surveyPrograms: [
                {
                    id: "i9nXRCg5eWd",
                    name: "Sneha's Test Event Program",
                },
            ],
            userGroups: {
                captureAccess: [
                    {
                        id: "",
                        name: "",
                    },
                ],
                readAccess: [
                    {
                        id: "",
                        name: "",
                    },
                ],
                adminAccess: [
                    {
                        id: "",
                        name: "",
                    },
                ],
            },
        },
    ];
}
