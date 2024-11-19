import * as xp from "@dhis2/expression-parser";
import _c from "../../domain/entities/generic/Collection";
import { Either } from "../../domain/entities/generic/Either";

export class D2ExpressionParser {
    public evaluateRuleEngineCondition(
        ruleCondition: string,
        variableValues: Map<ProgramRuleVariableName, ProgramRuleVariableValue>
    ): Either<Error, boolean> {
        try {
            const expressionParser = new xp.ExpressionJs(
                ruleCondition,
                xp.ExpressionMode.RULE_ENGINE_CONDITION
            );

            const ruleVariables = this.mapProgramRuleVariables(expressionParser, variableValues);
            const genericVariables = this.mapProgramVariables(expressionParser);
            const variables = new Map([...ruleVariables, ...genericVariables]);

            const expressionData = new xp.ExpressionDataJs(variables);

            const parsedResult: boolean = expressionParser.evaluate(
                () => console.debug(""),
                expressionData
            );

            return Either.success(parsedResult);
        } catch (error) {
            return Either.error(error as Error);
        }
    }

    private getVariableValueByType = (
        type: ProgramRuleVariableType,
        stringValue: xp.Nullable<string>
    ): xp.VariableValueJs => {
        const valueType = VariableValueTypeMap[type];
        return new xp.VariableValueJs(valueType, stringValue, [], null);
    };

    private mapProgramRuleVariables(
        expressionParser: xp.ExpressionJs,
        ruleVariables: Map<string, ProgramRuleVariableValue>
    ) {
        const programRuleVariables = expressionParser.collectProgramRuleVariableNames();
        const variablesValueMap = programRuleVariables.map(programRuleVariable => {
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

        return new Map(
            variablesValueMap.map(variable => [variable.programRuleVariable, variable.value])
        );
    }

    private mapProgramVariables(expressionParser: xp.ExpressionJs) {
        const programVariables = expressionParser.collectProgramVariablesNames();
        const programVariableValues = programVariables.map(programVariable => {
            switch (programVariable) {
                case "current_date": {
                    const currentISODate = new Date().toISOString().split("T")[0];
                    const currentDate = this.getVariableValueByType("date", currentISODate);
                    return { programVariable: programVariable, value: currentDate };
                }
                default:
                    throw new Error(
                        `Unhandled Program variable of type : ${programVariable}. Please contact developer`
                    );
            }
        });

        const programVariablesMap = new Map(
            programVariableValues.map(variable => [variable.programVariable, variable.value])
        );

        return programVariablesMap;
    }
}
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
