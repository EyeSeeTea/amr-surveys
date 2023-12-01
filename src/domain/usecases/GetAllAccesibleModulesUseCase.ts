import { FutureData } from "../../data/api-futures";
import { AMRSurveyModule } from "../entities/AMRSurveyModule";
import { ModuleRepository } from "../repositories/ModuleRepository";
import _ from "../../domain/entities/generic/Collection";
import { Future } from "../entities/generic/Future";
import { NamedRef } from "../entities/Ref";
import { GLOBAL_OU_ID } from "./SaveFormDataUseCase";
import { getUserAccess } from "../utils/menuHelper";

export class GetAllAccesibleModulesUseCase {
    constructor(private moduleRepository: ModuleRepository) {}

    public execute(currentUserGroups: NamedRef[]): FutureData<AMRSurveyModule[]> {
        return this.moduleRepository.getAll().flatMap(modules => {
            return this.moduleRepository
                .getProgramsEnrolledInOrgUnit(GLOBAL_OU_ID)
                .flatMap(programs => {
                    const accessibleModules = modules.map(module => {
                        const accesibleSurveysInModule = module.surveyPrograms.filter(sp =>
                            programs.some(p => sp.id === p)
                        );
                        //Access logic - A module is accessible to a user only if
                        const { hasReadAccess, hasCaptureAccess, hasAdminAccess } = getUserAccess(
                            module,
                            currentUserGroups
                        );
                        if (
                            //1. the org unit has enrolled to program corresponding to given module.
                            accesibleSurveysInModule.length > 0 &&
                            //2. user has read/capture/admin access to module
                            (hasReadAccess ||
                                hasCaptureAccess ||
                                hasAdminAccess ||
                                //3.  No usergroups specified in datastore
                                (module.userGroups.readAccess.length === 0 &&
                                    accesibleSurveysInModule.length > 0))
                        ) {
                            module.surveyPrograms = accesibleSurveysInModule;
                            return module;
                        }
                    });

                    return Future.success(_(accessibleModules).compact().value());
                });
        });
    }
}
