import { AMRSurveyModule } from "../../domain/entities/AMRSurveyModule";
import { Id } from "../../domain/entities/Ref";

export function getDefaultProgram(programId: Id, modules: AMRSurveyModule[]): string {
    const hasCustomForms = (
        module: AMRSurveyModule
    ): module is AMRSurveyModule & { customForms: NonNullable<AMRSurveyModule["customForms"]> } =>
        module.customForms !== undefined;

    const allCustomForms = modules
        .filter(hasCustomForms)
        .flatMap(module =>
            Object.values(module.customForms).flatMap(forms => Object.entries(forms))
        );

    return allCustomForms.find(entry => entry[1] === programId)?.[0] ?? programId;
}
