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
import { GetFilteredPatientsUseCase } from "./domain/usecases/GetFilteredPatientsUseCase";
import { SurveyRepository } from "./domain/repositories/SurveyRepository";
import { UserD2Repository } from "./data/repositories/UserD2Repository";
import { SurveyD2Repository } from "./data/repositories/SurveyFormD2Repository";
import { SurveyTestRepository } from "./data/repositories/testRepositories/SurveyFormTestRepository";
import { SaveFormDataUseCase } from "./domain/usecases/SaveFormDataUseCase";
import { GetPaginatedPatientSurveysUseCase } from "./domain/usecases/GetPaginatedPatientSurveysUseCase";
import { GetPopulatedSurveyUseCase } from "./domain/usecases/GetPopulatedSurveyUseCase";
import { NonAdminUserTestRepository } from "./data/repositories/testRepositories/NonAdminUserTestRepository";
import { DeleteSurveyUseCase } from "./domain/usecases/DeleteSurveyUseCase";
import { GetAllSurveysUseCase } from "./domain/usecases/GetAllSurveysUseCase";
import { PaginatedSurveyRepository } from "./domain/repositories/PaginatedSurveyRepository";
import { PaginatedSurveyTestRepository } from "./data/repositories/testRepositories/PaginatedSurveyTestRepository";
import { PaginatedSurveyD2Repository } from "./data/repositories/PaginatedSurveyD2Repository";
import { GetUserAccessibleOUByLevel } from "./domain/usecases/GetUserAccessibleOUByLevel";
import { GetChildCountUseCase } from "./domain/usecases/GetChildCountUseCase";
import { ApplyInitialRulesToSurveyUseCase } from "./domain/usecases/ApplyInitialRulesToSurveyUseCase";
import { ASTGuidelinesRepository } from "./domain/repositories/ASTGuidelinesRepository";
import { GetASTGuidelinesUseCase } from "./domain/usecases/GetASTGuidelinesUseCase";
import { ASTGuidelinesD2Repository } from "./data/repositories/ASTGuidelinesD2Repository";
import { ASTGuidelinesTestRepository } from "./data/repositories/testRepositories/ASTGuidelinesTestRepository";
import { GetSurveyAntibioticsBlacklistUseCase } from "./domain/usecases/GetSurveyAntibioticsBlacklistUseCase";
import { RemoveRepeatableProgramStageUseCase } from "./domain/usecases/RemoveRepeatableProgramStageUseCase";

export type CompositionRoot = ReturnType<typeof getCompositionRoot>;

type Repositories = {
    usersRepository: UserRepository;
    localeRepository: LocalesRepository;
    moduleRepository: ModuleRepository;
    surveyFormRepository: SurveyRepository;
    paginatedSurveyRepository: PaginatedSurveyRepository;
    astGuidelinesRepository: ASTGuidelinesRepository;
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
            getAccessibleOUByLevel: new GetUserAccessibleOUByLevel(repositories.usersRepository),
            savePassword: new SavePasswordUseCase(repositories.usersRepository),
            saveKeyUiLocale: new SaveKeyUiLocaleUseCase(repositories.usersRepository),
            saveKeyDbLocale: new SaveKeyDbLocaleUseCase(repositories.usersRepository),
        },
        surveys: {
            getForm: new GetSurveyUseCase(repositories.surveyFormRepository),
            getPopulatedForm: new GetPopulatedSurveyUseCase(repositories.surveyFormRepository),
            saveFormData: new SaveFormDataUseCase(
                repositories.surveyFormRepository,
                repositories.astGuidelinesRepository
            ),
            getSurveys: new GetAllSurveysUseCase(repositories.surveyFormRepository),
            getFilteredPatients: new GetFilteredPatientsUseCase(
                repositories.paginatedSurveyRepository,
                repositories.surveyFormRepository
            ),
            getPaginatedSurveys: new GetPaginatedPatientSurveysUseCase(
                repositories.paginatedSurveyRepository,
                repositories.surveyFormRepository
            ),
            deleteSurvey: new DeleteSurveyUseCase(
                repositories.surveyFormRepository,
                repositories.astGuidelinesRepository
            ),
            getChildCount: new GetChildCountUseCase(repositories.surveyFormRepository),
            applyInitialRules: new ApplyInitialRulesToSurveyUseCase(),
            getSurveyAntibioticsBlacklist: new GetSurveyAntibioticsBlacklistUseCase(
                repositories.surveyFormRepository
            ),
            removeRepeatableStage: new RemoveRepeatableProgramStageUseCase(
                repositories.surveyFormRepository
            ),
        },
        astGuidelines: {
            getGuidelines: new GetASTGuidelinesUseCase(repositories.astGuidelinesRepository),
        },
    };
}

export function getWebappCompositionRoot(api: D2Api) {
    const dataStoreClient = new DataStoreClient(api);
    const repositories: Repositories = {
        usersRepository: new UserD2Repository(api),
        localeRepository: new LocalesD2Repository(api),
        moduleRepository: new ModuleD2Repository(dataStoreClient, api),
        surveyFormRepository: new SurveyD2Repository(api, dataStoreClient),
        paginatedSurveyRepository: new PaginatedSurveyD2Repository(api),
        astGuidelinesRepository: new ASTGuidelinesD2Repository(dataStoreClient),
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
        astGuidelinesRepository: new ASTGuidelinesTestRepository(),
    };

    return getCompositionRoot(repositories);
}
