import { Codec, decodeModel } from "./codec";

export function getValidationErrorsByItem<Model, T>(
    model: Codec<Model>,
    collection: T[]
): { item: T; error: string }[] | null {
    const validationErrors = collection
        .map(item => ({ item, validation: decodeModel(model, item) }))
        .filter(({ validation }) => validation.isError())
        .map(({ item, validation }) => ({ item, error: validation.value.error as string }));
    return validationErrors.length ? validationErrors : null;
}
