import * as xp from "@dhis2/expression-parser";
import _c from "../../domain/entities/generic/Collection";

export type ProgramRuleVariableType = "text" | "number" | "date" | "boolean";

export type ProgramRuleVariableName = string;
export type ProgramRuleVariableValue = {
    type: ProgramRuleVariableType;
    value: string;
};

const VariableValueTypeMap: Record<ProgramRuleVariableType, xp.ValueType> = {
    text: xp.ValueType.STRING,
    boolean: xp.ValueType.BOOLEAN,
    date: xp.ValueType.DATE,
    number: xp.ValueType.NUMBER,
};

export class D2ExpressionParser {
    public evaluateRuleEngineCondition(
        ruleCondtion: string,
        ruleVariables: Map<ProgramRuleVariableName, ProgramRuleVariableValue>
    ): boolean {
        const expressionParser = new xp.ExpressionJs(
            ruleCondtion,
            xp.ExpressionMode.RULE_ENGINE_CONDITION
        );

        //Mapper function for program rule variables
        const variables = expressionParser.collectProgramRuleVariableNames();

        const variablesValueMap = this.mapProgramVariables(variables, ruleVariables);

        const variablesMap = new Map(
            variablesValueMap.map(variable => [variable.programRuleVariable, variable.value])
        );

        // const programVariables = expressionParser.collectProgramVariablesNames();
        // const programVariablesValues = _c(
        //     programVariables.map(programVariable => {
        //         if (programVariable === "current_date")
        //             return {
        //                 programVariable: xp.ProgramVariable.current_date.name,
        //                 value: new Date(),
        //             };
        //     })
        // )
        //     .compact()
        //     .value();
        // const programVariablesMap = new Map(
        //     programVariablesValues.map(a => [a.programVariable, a.value])
        // );
        const expressionData = new xp.ExpressionDataJs(
            variablesMap,
            undefined,
            undefined,
            undefined,
            undefined
        );

        const parsedResult: boolean = expressionParser.evaluate(
            () => console.debug(""),
            expressionData
        );
        return parsedResult;
    }

    private getVariableValueByType = (
        type: ProgramRuleVariableType,
        stringValue: xp.Nullable<string>
    ): xp.VariableValueJs => {
        const valueType = VariableValueTypeMap[type];
        return new xp.VariableValueJs(valueType, stringValue, [], null);
    };

    private mapProgramVariables(
        programRuleVariables: string[],
        ruleVariables: Map<string, ProgramRuleVariableValue>
    ) {
        return programRuleVariables.map(programRuleVariable => {
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
    }
}
