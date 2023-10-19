import { FutureData } from "../../data/api-futures";
import { AMRSurveyModule } from "../entities/AMRSurveyModule";
import { ModuleRepository } from "../repositories/ModuleRepository";
import _ from "../../domain/entities/generic/Collection";
import { Future } from "../entities/generic/Future";
import { NamedRef } from "../entities/Ref";
import { Id } from "@eyeseetea/d2-api";

export class GetAllAccesibleModulesUseCase {
    constructor(private moduleRepository: ModuleRepository) {}

    public execute(
        currentUserGroups: NamedRef[],
        currentOrgUnitId: Id
    ): FutureData<AMRSurveyModule[]> {
        return this.moduleRepository.getAll().flatMap(modules => {
            return this.moduleRepository
                .getProgramsEnrolledInOrgUnit(currentOrgUnitId)
                .flatMap(programs => {
                    const accessibleModules = modules.map(module => {
                        const accesibleSurveysInModule = module.surveyPrograms.filter(sp =>
                            programs.some(p => sp.id === p)
                        );
                        //Access logic - A module is accessible to a user only if
                        if (
                            //1. user belongs to read access user group for given module.
                            (currentUserGroups.some(
                                cug =>
                                    module.userGroups.readAccess.filter(ug => ug.id === cug.id)
                                        .length > 0
                            ) &&
                                //2. the org unit has enrolled to program corresponding to given module.
                                accesibleSurveysInModule.length > 0) ||
                            //3.  No usergroups specified in datastore
                            (currentUserGroups.length === 0 && accesibleSurveysInModule.length > 0)
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
