import { LocalesD2Repository } from "./data/repositories/LocalesD2Repository";
import { UserD2Repository } from "./data/repositories/UserD2Repository";
import { UserTestRepository } from "./data/repositories/testRepositories/UserTestRepository";
import { LocalesRepository } from "./domain/repositories/LocalesRepository";
import { UserRepository } from "./domain/repositories/UserRepository";
import { GetCurrentUserUseCase } from "./domain/usecases/GetCurrentUserUseCase";
import { GetDatabaseLocalesUseCase } from "./domain/usecases/GetDatabaseLocalesUseCase";
import { GetUiLocalesUseCase } from "./domain/usecases/GetUiLocalesUseCase";
import { SaveKeyDbLocaleUseCase } from "./domain/usecases/SaveKeyDbLocaleUseCase";
import { SaveKeyUiLocaleUseCase } from "./domain/usecases/SaveKeyUiLocaleUseCase";
import { SavePasswordUseCase } from "./domain/usecases/SavePasswordUseCase";
import { D2Api } from "./types/d2-api";
import { LocalesTestRepository } from "./data/repositories/testRepositories/LocalesTestRepository";
import { GetAllModulesUseCase } from "./domain/usecases/GetAllModulesUseCase";
import { ModuleRepository } from "./domain/repositories/ModuleRepository";
import { ModuleD2Repository } from "./data/repositories/Moduled2Repository";
import { DataStoreClient } from "./data/DataStoreClient";

export type CompositionRoot = ReturnType<typeof getCompositionRoot>;

type Repositories = {
    usersRepository: UserRepository;
    localeRepository: LocalesRepository;
    moduleRepository: ModuleRepository;
};

function getCompositionRoot(repositories: Repositories) {
    return {
        locales: {
            getUiLocales: new GetUiLocalesUseCase(repositories.localeRepository),
            getDatabaseLocales: new GetDatabaseLocalesUseCase(repositories.localeRepository),
        },
        modules: {
            getAll: new GetAllModulesUseCase(repositories.moduleRepository),
        },
        users: {
            getCurrent: new GetCurrentUserUseCase(repositories.usersRepository),
            savePassword: new SavePasswordUseCase(repositories.usersRepository),
            saveKeyUiLocale: new SaveKeyUiLocaleUseCase(repositories.usersRepository),
            saveKeyDbLocale: new SaveKeyDbLocaleUseCase(repositories.usersRepository),
        },
    };
}

export function getWebappCompositionRoot(api: D2Api) {
    const dataStoreClient = new DataStoreClient(api);
    const repositories: Repositories = {
        usersRepository: new UserD2Repository(api),
        localeRepository: new LocalesD2Repository(api),
        moduleRepository: new ModuleD2Repository(dataStoreClient),
    };

    return getCompositionRoot(repositories);
}

export function getTestCompositionRoot() {
    const repositories: Repositories = {
        usersRepository: new UserTestRepository(),
        localeRepository: new LocalesTestRepository(),
    };

    return getCompositionRoot(repositories);
}
