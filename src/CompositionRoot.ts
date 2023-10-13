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

export type CompositionRoot = ReturnType<typeof getCompositionRoot>;

type Repositories = {
    usersRepository: UserRepository;
    localeRepository: LocalesRepository;
};

function getCompositionRoot(repositories: Repositories) {
    return {
        users: {
            getCurrent: new GetCurrentUserUseCase(repositories.usersRepository),
            savePassword: new SavePasswordUseCase(repositories.usersRepository),
            saveKeyUiLocale: new SaveKeyUiLocaleUseCase(repositories.usersRepository),
            saveKeyDbLocale: new SaveKeyDbLocaleUseCase(repositories.usersRepository),
        },
        locales: {
            getUiLocales: new GetUiLocalesUseCase(repositories.localeRepository),
            getDatabaseLocales: new GetDatabaseLocalesUseCase(repositories.localeRepository),
        },
    };
}

export function getWebappCompositionRoot(api: D2Api) {
    const repositories: Repositories = {
        usersRepository: new UserD2Repository(api),
        localeRepository: new LocalesD2Repository(api),
    };

    return getCompositionRoot(repositories);
}

export function getTestCompositionRoot() {
    const repositories: Repositories = {
        usersRepository: new UserTestRepository(),
        localeRepository : new LocalesTestRepository()
    };

    return getCompositionRoot(repositories);
}
