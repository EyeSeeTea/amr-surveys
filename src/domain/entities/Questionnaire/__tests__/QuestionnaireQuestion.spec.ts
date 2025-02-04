import { describe, assert, it } from "vitest";
import { NumberQuestion, QuestionnaireQuestion } from "../QuestionnaireQuestion";

const baseValidNumbers = [""];

const baseInvalidNumbers = [
    "01", // Leading zeroes causes errors in dhis2
    "1.",
    "1.1.1",
    "-1.",
    "-1.1.1",
    "1-1",
    "1-1.1",
    "1-1-1",
    "1e2", // Exponential notation causes errors in dhis2
    "1,2", // only . as decimal separator is allowed
    "00",
    "+10",
    "1a1",
    "b",
    "--1",
];

function runExpectations(
    expectedValid: string[],
    expectedInvalid: string[],
    numberType: NumberQuestion["numberType"]
) {
    expectedValid.forEach(number => {
        assert(
            QuestionnaireQuestion.isValidNumberValue(number, numberType) === true,
            `"${number}" should be valid`
        );
    });
    expectedInvalid.forEach(number => {
        assert(
            QuestionnaireQuestion.isValidNumberValue(number, numberType) === false,
            `"${number}" should NOT be valid`
        );
    });
}

describe("QuestionnaireQuestion", () => {
    describe("isValidNumberValue", () => {
        it("should validate correctly NumberType=NUMBER", () => {
            const validNumbers = [
                ...baseValidNumbers,
                "1.1",
                "-1",
                "-1.1",
                "1243453",
                "-0.12543",
                "0.1234",
                "0",
            ];
            const invalidNumbers = [...baseInvalidNumbers];
            runExpectations(validNumbers, invalidNumbers, "NUMBER");
        });
        it("should validate correctly NumberType=INTEGER", () => {
            const validNumbers = [...baseValidNumbers, "2", "1000234432", "-100345"];
            const invalidNumbers = [...baseInvalidNumbers, "1.1", "0.2"];
            runExpectations(validNumbers, invalidNumbers, "INTEGER");
        });
        it("should validate correctly NumberType=INTEGER_NEGATIVE", () => {
            const validNumbers = [...baseValidNumbers, "-2", "-1000234432", "-100345"];
            const invalidNumbers = [...baseInvalidNumbers, "1.1", "0.2", "1", "0"];
            runExpectations(validNumbers, invalidNumbers, "INTEGER_NEGATIVE");
        });
        it("should validate correctly NumberType=INTEGER_POSITIVE", () => {
            const validNumbers = [...baseValidNumbers, "2", "1000234432", "100345"];
            const invalidNumbers = [...baseInvalidNumbers, "1.1", "-0.2", "-123423", "0"];
            runExpectations(validNumbers, invalidNumbers, "INTEGER_POSITIVE");
        });
        it("should validate correctly NumberType=INTEGER_ZERO_OR_POSITIVE", () => {
            const validNumbers = [...baseValidNumbers, "2", "1000234432", "100345", "0"];
            const invalidNumbers = [...baseInvalidNumbers, "1.1", "-0.2", "-123423"];
            runExpectations(validNumbers, invalidNumbers, "INTEGER_ZERO_OR_POSITIVE");
        });
    });
});
