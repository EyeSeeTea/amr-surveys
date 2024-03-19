import { D2ProgramRule, D2ProgramRuleAction, D2ProgramRuleVariable } from "../entities/D2Program";

import { QuestionnaireRule } from "../../domain/entities/Questionnaire/QuestionnaireRules";
import _ from "../../domain/entities/generic/Collection";

export const getProgramRules = (
    programRulesResponse: D2ProgramRule[] | undefined,
    programRuleVariables: D2ProgramRuleVariable[] | undefined,
    programRuleActionsResponse: D2ProgramRuleAction[] | undefined
): QuestionnaireRule[] => {
    return (
        programRulesResponse?.map(({ id, condition, programRuleActions: actions }) => {
            const dataElementIds =
                condition.match(/#{(.*?)}/g)?.map(programRuleVariableName => {
                    const variableName = programRuleVariableName.replace(/#{|}/g, "");

                    const dataElementId = programRuleVariables?.find(
                        programRuleVariable => variableName === programRuleVariable.name
                    )?.dataElement?.id;

                    if (!dataElementId) {
                        console.debug(`Could not find dataElementId for variable: ${variableName}`);
                    }
                    return dataElementId;
                }) || [];

            const parsedCondition = condition.replace(/#{(.*?)}/g, (match, programRuleVar) => {
                const dataElementId = programRuleVariables?.find(
                    programRuleVariable => programRuleVariable.name === programRuleVar
                )?.dataElement?.id;

                return `#{${dataElementId}}`;
            });

            const programRuleActionIds: string[] = actions.map(action => action.id);

            const programRuleActions: D2ProgramRuleAction[] | undefined = programRuleActionsResponse
                ?.filter(programRuleAction => programRuleActionIds.includes(programRuleAction.id))
                .map(programRuleAction => {
                    return {
                        id: programRuleAction.id,
                        programRuleActionType: programRuleAction.programRuleActionType,
                        data: programRuleAction.data,
                        dataElement: programRuleAction.dataElement,
                        programStageSection: {
                            id: programRuleAction.programStageSection?.id,
                        },
                        programStage: {
                            id: programRuleAction.programStage?.id,
                        },
                        content: programRuleAction.content,
                    };
                });

            return {
                id: id,
                condition: parsedCondition,
                dataElementIds: _(dataElementIds).uniq().compact().value(),
                actions: programRuleActions || [],
            };
        }) || []
    );
};
