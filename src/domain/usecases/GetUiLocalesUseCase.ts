import { FutureData } from "../../data/api-futures";
import { LocalesRepository } from "../repositories/LocalesRepository";
import { LocalesType } from "./GetDatabaseLocalesUseCase";

export class GetUiLocalesUseCase {
    constructor(private localesRepository: LocalesRepository) {}

    public execute(): FutureData<LocalesType> {
        return this.localesRepository.getDatabaseLocales();
    }
}
