import { AMRSurveyModule } from "../AMRSurveyModule";

export function createModuleList(): AMRSurveyModule[] {
    return [
        {
            color: "#A6228F",
            id: "ER1eGzQetqt",
            name: "Point Prevalence Survey",
            surveyPrograms: [
                {
                    id: "SiUPBRxBvSS",
                    name: "PPS Country Questionnaire",
                    type: "NationalSurvey",
                },
                {
                    id: "Kimo6Gb1Lxu",
                    name: "PPS Hospital Form",
                    type: "HospitalSurvey",
                },
                {
                    id: "ukcTasHwgdG",
                    name: "PPS Patient Register",
                    type: "SupranationalSurvey",
                },
                {
                    id: "iwwz8Xssua2",
                    name: "PPS Survey Form",
                    type: "NationalSurvey",
                },
                {
                    id: "WWeEoX0pfYL",
                    name: "PPS Ward Register",
                    type: "SupranationalSurvey",
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
        {
            color: "#E23A75",
            id: "BwJDlAxZTOj",
            name: "Prevalence",
            surveyPrograms: [
                {
                    id: "i9nXRCg5eWd",
                    name: "Sneha's Test Event Program",
                    type: "NationalSurvey",
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
