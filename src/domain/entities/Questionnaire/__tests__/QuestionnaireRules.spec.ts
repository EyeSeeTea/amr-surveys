import { describe, expect, it } from "vitest";
import { D2ProgramRuleVariable } from "../../../../data/entities/D2Program";
import { Question, SelectQuestion, TextQuestion } from "../QuestionnaireQuestion";
import {
    QuestionnaireRule,
    QuestionnaireRuleAction,
    getApplicableRules,
} from "../QuestionnaireRules";

const base = { isVisible: true, sortOrder: undefined, errors: [] };

const text = (id: string, value?: string): TextQuestion => ({
    ...base,
    id,
    code: id,
    name: id,
    text: id,
    type: "text",
    multiline: false,
    value,
});

const select = (id: string, code?: string): SelectQuestion => ({
    ...base,
    id,
    code: id,
    name: id,
    text: id,
    type: "select",
    options: [{ id: "o1", name: "Option 1", code: "O1" }],
    value: code ? { id: code, name: code, code } : undefined,
});

// One variables array shared by every rule, as getProgramRules builds them. Names are not 11 characters
// long: the expression parser reads #{xxxxxxxxxxx} as a data element id, not as a variable name.
const variables: D2ProgramRuleVariable[] = [
    { id: "v1", name: "Antibiotic 1", dataElement: { id: "abx1" } },
    { id: "v2", name: "Antibiotic 2", dataElement: { id: "abx2" } },
    { id: "v3", name: "Patient age", dataElement: { id: "age" } },
];

const hide = (id: string, dataElementId: string): QuestionnaireRuleAction => ({
    id,
    programRuleActionType: "HIDEFIELD",
    dataElement: { id: dataElementId },
});

function rule(
    id: string,
    condition: string,
    dataElementIds: string[],
    actions: QuestionnaireRuleAction[] = []
): QuestionnaireRule {
    return {
        id,
        condition,
        dataElementIds,
        teAttributeIds: [],
        actions,
        programRuleVariables: variables,
    };
}

const duplicateRule = rule(
    "duplicate-1-2",
    "#{Antibiotic 1} != '' && #{Antibiotic 1} == #{Antibiotic 2}",
    ["abx1", "abx2"],
    [
        {
            id: "warn",
            programRuleActionType: "SHOWERROR",
            dataElement: { id: "abx2" },
            content: "Duplicate",
        },
    ]
);
const adultRule = rule(
    "adult",
    "d2:length(#{Patient age}) > 0 && #{Patient age} >= 18",
    ["age"],
    [hide("hide-paediatric", "paed")]
);
const assignRule = rule(
    "assign",
    "true",
    [],
    [
        {
            id: "assign-age",
            programRuleActionType: "ASSIGN",
            dataElement: { id: "age" },
            data: "#{Patient age} + 1",
        },
    ]
);
const rules = [duplicateRule, adultRule, assignRule];

const questions = (overrides: Question[] = []): Question[] => {
    const all: Question[] = [
        select("abx1", "AMK"),
        select("abx2", "GEN"),
        text("age", "40"),
        text("paed"),
    ];
    return all.map(question => overrides.find(o => o.id === question.id) ?? question);
};

describe("getApplicableRules", () => {
    it("returns the rules that read the question or act on it, once each and in their original order", () => {
        expect(getApplicableRules(select("abx2"), rules, questions()).map(r => r.id)).toEqual([
            "duplicate-1-2",
        ]);
        expect(getApplicableRules(text("age"), rules, questions()).map(r => r.id)).toEqual([
            "adult",
            "assign",
        ]);
        expect(getApplicableRules(text("paed"), rules, questions()).map(r => r.id)).toEqual([
            "adult",
        ]);
        expect(getApplicableRules(text("unrelated"), rules, questions())).toEqual([]);
    });

    it("evaluates each condition with the current answers, not with answers from an earlier call", () => {
        const different = getApplicableRules(select("abx1"), rules, questions());
        const same = getApplicableRules(select("abx1"), rules, questions([select("abx2", "AMK")]));
        const differentAgain = getApplicableRules(select("abx1"), rules, questions());

        expect(different[0]?.parsedResult).toBe(false);
        expect(same[0]?.parsedResult).toBe(true);
        expect(differentAgain[0]?.parsedResult).toBe(false);
    });

    it("treats a number answer as a number and an empty answer as empty", () => {
        const adult = getApplicableRules(text("age"), rules, questions());
        const child = getApplicableRules(text("age"), rules, questions([text("age", "9")]));
        const unknown = getApplicableRules(text("age"), rules, questions([text("age", undefined)]));

        expect(adult.find(r => r.id === "adult")?.parsedResult).toBe(true);
        expect(child.find(r => r.id === "adult")?.parsedResult).toBe(false);
        expect(unknown.find(r => r.id === "adult")?.parsedResult).toBe(false);
    });

    it("evaluates ASSIGN expressions with the current answers", () => {
        const [assign] = getApplicableRules(
            text("age"),
            [assignRule],
            questions([text("age", "41")])
        );

        expect(assign?.actions[0]?.dataEvaluated).toBe(42);
    });

    it("uses the first question when two share an id (repeated stages), as before", () => {
        const withRepeat = [...questions([select("abx2", "AMK")]), select("abx2", "OTHER")];

        expect(getApplicableRules(select("abx1"), rules, withRepeat)[0]?.parsedResult).toBe(true);
    });

    it("indexes each rules list separately", () => {
        expect(getApplicableRules(text("age"), [adultRule], questions()).map(r => r.id)).toEqual([
            "adult",
        ]);
        expect(getApplicableRules(text("age"), [assignRule], questions()).map(r => r.id)).toEqual([
            "assign",
        ]);
    });
});
