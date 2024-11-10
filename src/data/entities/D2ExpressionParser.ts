import * as xp from "@dhis2/expression-parser";
import _c from "../../domain/entities/generic/Collection";
import { Either } from "../../domain/entities/generic/Either";

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
    ): Either<Error, boolean> {
        try {
            const expressionParser = new xp.ExpressionJs(
                ruleCondtion,
                xp.ExpressionMode.RULE_ENGINE_CONDITION
            );

            const variables = expressionParser.collectProgramRuleVariableNames();
            const variablesValueMap = this.mapProgramVariables(variables, ruleVariables);
            const variablesMap = new Map(
                variablesValueMap.map(variable => [variable.programRuleVariable, variable.value])
            );

            const programVariables = expressionParser.collectProgramVariablesNames();
            programVariables.forEach(programVariable => {
                switch (programVariable) {
                    case "current_date": {
                        variablesMap.set(
                            programVariable,
                            this.getVariableValueByType(
                                "date",
                                new Date().toISOString().split("T")[0]
                            )
                        );
                        break;
                    }
                    default:
                        throw new Error(
                            `Unhandled Program variable of type : ${programVariable}. Please contact developer`
                        );
                }
            });

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

            return Either.success(parsedResult);
        } catch (error) {
            return Either.error(
                new Error(
                    `An error occurred while evaluating the rule in D2ExpressionParser::evaluateRuleEngineCondition: ${error}`
                )
            );
        }
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
