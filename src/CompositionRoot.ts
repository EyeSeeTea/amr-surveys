import { LocalesD2Repository } from "./data/repositories/LocalesD2Repository";
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
import { GetAllAccesibleModulesUseCase } from "./domain/usecases/GetAllAccesibleModulesUseCase";
import { ModuleRepository } from "./domain/repositories/ModuleRepository";
import { ModuleD2Repository } from "./data/repositories/ModuleD2Repository";
import { DataStoreClient } from "./data/DataStoreClient";
import { ModulesTestRepository } from "./data/repositories/testRepositories/ModuleTestRepository";
import { GetSurveyUseCase } from "./domain/usecases/GetSurveyUseCase";
import { SurveyRepository } from "./domain/repositories/SurveyRepository";
import { UserD2Repository } from "./data/repositories/UserD2Repository";
import { SurveyD2Repository } from "./data/repositories/SurveyFormD2Repository";
import { SurveyTestRepository } from "./data/repositories/testRepositories/SurveyFormTestRepository";
import { SaveFormDataUseCase } from "./domain/usecases/SaveFormDataUseCase";
import { GetPaginatedSurveysUseCase } from "./domain/usecases/GetPaginatedSurveysUseCase";
import { GetPopulatedSurveyUseCase } from "./domain/usecases/GetPopulatedSurveyUseCase";
import { NonAdminUserTestRepository } from "./data/repositories/testRepositories/NonAdminUserTestRepository";
import { DeleteSurveyUseCase } from "./domain/usecases/DeleteSurveyUseCase";
import { GetAllSurveysUseCase } from "./domain/usecases/GetAllSurveysUseCase";
import { PaginatedSurveyRepository } from "./domain/repositories/PaginatedSurveyRepository";
import { PaginatedSurveyTestRepository } from "./data/repositories/testRepositories/PaginatedSurveyTestRepository";
import { PaginatedSurveyD2Repository } from "./data/repositories/PaginatedSurveyD2Repository";

export type CompositionRoot = ReturnType<typeof getCompositionRoot>;

type Repositories = {
    usersRepository: UserRepository;
    localeRepository: LocalesRepository;
    moduleRepository: ModuleRepository;
    surveyFormRepository: SurveyRepository;
    paginatedSurveyRepository: PaginatedSurveyRepository;
};

function getCompositionRoot(repositories: Repositories) {
    return {
        locales: {
            getUiLocales: new GetUiLocalesUseCase(repositories.localeRepository),
            getDatabaseLocales: new GetDatabaseLocalesUseCase(repositories.localeRepository),
        },
        modules: {
            getAllAccessible: new GetAllAccesibleModulesUseCase(repositories.moduleRepository),
        },
        users: {
            getCurrent: new GetCurrentUserUseCase(repositories.usersRepository),
            savePassword: new SavePasswordUseCase(repositories.usersRepository),
            saveKeyUiLocale: new SaveKeyUiLocaleUseCase(repositories.usersRepository),
            saveKeyDbLocale: new SaveKeyDbLocaleUseCase(repositories.usersRepository),
        },
        surveys: {
            getForm: new GetSurveyUseCase(repositories.surveyFormRepository),
            getPopulatedForm: new GetPopulatedSurveyUseCase(repositories.surveyFormRepository),
            saveFormData: new SaveFormDataUseCase(repositories.surveyFormRepository),
            getSurveys: new GetAllSurveysUseCase(repositories.surveyFormRepository),
            getPaginatedSurveys: new GetPaginatedSurveysUseCase(
                repositories.paginatedSurveyRepository
            ),
            deleteSurvey: new DeleteSurveyUseCase(repositories.surveyFormRepository),
        },
    };
}

export function getWebappCompositionRoot(api: D2Api) {
    const dataStoreClient = new DataStoreClient(api);
    const repositories: Repositories = {
        usersRepository: new UserD2Repository(api),
        localeRepository: new LocalesD2Repository(api),
        moduleRepository: new ModuleD2Repository(dataStoreClient, api),
        surveyFormRepository: new SurveyD2Repository(api),
        paginatedSurveyRepository: new PaginatedSurveyD2Repository(
            api,
            new SurveyD2Repository(api)
        ),
    };

    return getCompositionRoot(repositories);
}

export function getTestCompositionRoot(nonAdminUser?: boolean) {
    const repositories: Repositories = {
        usersRepository: nonAdminUser ? new NonAdminUserTestRepository() : new UserTestRepository(),
        localeRepository: new LocalesTestRepository(),
        moduleRepository: new ModulesTestRepository(),
        surveyFormRepository: new SurveyTestRepository(),
        paginatedSurveyRepository: new PaginatedSurveyTestRepository(),
    };

    return getCompositionRoot(repositories);
}
