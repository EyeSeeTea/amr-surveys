import * as xp from "@dhis2/expression-parser";
import _c from "../../domain/entities/generic/Collection";

export type D2ExpressionParserProgramRuleVariableTypes =
    | "text"
    | "number"
    | "date"
    | "datetime"
    | "boolean"
    | "select";

export type D2ExpressionParserProgramRuleVariableName = string;
export type D2ExpressionParserProgramRuleVariableValue = {
    type: D2ExpressionParserProgramRuleVariableTypes;
    value: string | null;
};

export class D2ExpressionParser {
    public evaluateRuleEngineCondtion(
        ruleCondtion: string,
        ruleVariables: Map<
            D2ExpressionParserProgramRuleVariableName,
            D2ExpressionParserProgramRuleVariableValue
        >
    ): boolean {
        const programRuleVariableExpressionParser = new xp.ExpressionJs(
            ruleCondtion,
            xp.ExpressionMode.RULE_ENGINE_CONDITION
        );

        //Mapper function for program rule variables
        const programRuleVariables =
            programRuleVariableExpressionParser.collectProgramRuleVariableNames();

        const programRuleVariablesValueMap = programRuleVariables.map(programRuleVariable => {
            const currentProgramRuleVariableValue = ruleVariables.get(programRuleVariable);

            if (!currentProgramRuleVariableValue)
                return {
                    programRuleVariable: programRuleVariable,
                    value: new xp.VariableValueJs(xp.ValueType.STRING, null, [], null),
                };

            const variableValue = this.getVariableValueByType(
                currentProgramRuleVariableValue.type,
                currentProgramRuleVariableValue.value === ""
                    ? null
                    : currentProgramRuleVariableValue.value
            );

            return {
                programRuleVariable: programRuleVariable,
                value: variableValue,
            };
        });

        const programRuleVariablesMap = new Map(
            programRuleVariablesValueMap.map(a => [a.programRuleVariable, a.value])
        );

        const programVariables = programRuleVariableExpressionParser.collectProgramVariablesNames();
        const programVariablesValues = _c(
            programVariables.map(programVariable => {
                if (programVariable === "current_date")
                    return {
                        programVariable: xp.ProgramVariable.current_date.name,
                        value: new Date(),
                    };
            })
        )
            .compact()
            .value();
        const programVariablesMap = new Map(
            programVariablesValues.map(a => [a.programVariable, a.value])
        );
        const expressionData = new xp.ExpressionDataJs(
            programRuleVariablesMap,
            programVariablesMap,
            undefined,
            undefined,
            undefined
        );

        const parsedResult: boolean = programRuleVariableExpressionParser.evaluate(
            a => console.debug("ABC" + a), //SNEHA DEBUG : what is this?
            expressionData
        );
        return parsedResult;
    }

    private getVariableValueByType = (
        type: D2ExpressionParserProgramRuleVariableTypes,
        stringValue: xp.Nullable<string>
    ): xp.VariableValueJs => {
        switch (type) {
            case "select":
            case "text":
                return new xp.VariableValueJs(xp.ValueType.STRING, stringValue, [], null);
            case "boolean":
                return new xp.VariableValueJs(xp.ValueType.BOOLEAN, stringValue, [], null);
            case "date":
            case "datetime":
                return new xp.VariableValueJs(xp.ValueType.DATE, stringValue, [], null);

            case "number":
                return new xp.VariableValueJs(xp.ValueType.NUMBER, stringValue, [], null);
        }
    };
}
