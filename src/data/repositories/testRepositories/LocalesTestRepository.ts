import { Future } from "../../../domain/entities/generic/Future";
import { LocalesRepository } from "../../../domain/repositories/LocalesRepository";
import { LocalesType } from "../../../domain/usecases/GetDatabaseLocalesUseCase";
import { FutureData } from "../../api-futures";

export class LocalesTestRepository implements LocalesRepository {
    getUiLocales(): FutureData<LocalesType> {
        return Future.success([{ locale: "EN", name: "English" }]);
    }

    getDatabaseLocales(): FutureData<LocalesType> {
        return Future.success([{ locale: "EN", name: "English" }]);
    }
}
