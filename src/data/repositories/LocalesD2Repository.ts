import { D2Api } from "../../types/d2-api";
import { LocalesRepository } from "../../domain/repositories/LocalesRepository";
import { LocalesType } from "../../domain/usecases/GetDatabaseLocalesUseCase";
import { apiToFuture, FutureData } from "../api-futures";

type DatabaseLocaleType = {
    name: string;
    locale: string;
    [rest: string]: string;
}[];

export class LocalesD2Repository implements LocalesRepository {
    constructor(private api: D2Api) {}

    getUiLocales(): FutureData<LocalesType> {
        return apiToFuture(
            this.api.get<LocalesType>("locales/ui").map(locales => {
                return locales.data;
            })
        );
    }

    getDatabaseLocales(): FutureData<LocalesType> {
        return apiToFuture(
            this.api.get<DatabaseLocaleType>("/locales/dbLocales").map(locales => {
                return locales.data.map(locale => {
                    return { locale: locale.locale, name: locale.name };
                });
            })
        );
    }
}
