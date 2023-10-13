import { LocalesRepository } from "../../../domain/repositories/LocalesRepository";
import { LocalesType } from "../../../domain/usecases/GetDatabaseLocalesUseCase";
import { FutureData } from "../../api-futures";

export class LocalesTestRepository implements LocalesRepository {
    getUiLocales(): FutureData<LocalesType> {
        throw new Error("Method not implemented.");
    }

    getDatabaseLocales(): FutureData<LocalesType> {
        throw new Error("Method not implemented.");
    }
}
