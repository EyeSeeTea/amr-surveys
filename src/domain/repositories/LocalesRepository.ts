import { FutureData } from "../../data/api-futures";
import { LocalesType } from "../usecases/GetDatabaseLocalesUseCase";

export interface LocalesRepository {
    getDatabaseLocales(): FutureData<LocalesType>;
    getUiLocales(): FutureData<LocalesType>;
}
