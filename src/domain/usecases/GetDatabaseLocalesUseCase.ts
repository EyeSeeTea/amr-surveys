import { FutureData } from "../../data/api-futures";
import { LocalesRepository } from "../repositories/LocalesRepository";

export type LocalesType = {
    locale: string;
    name: string;
}[];

export class GetDatabaseLocalesUseCase {
    constructor(private localesRepository: LocalesRepository) {}

    public execute(): FutureData<LocalesType> {
        return this.localesRepository.getDatabaseLocales();
    }
}
