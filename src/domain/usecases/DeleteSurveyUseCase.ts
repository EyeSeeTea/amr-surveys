import { FutureData } from "../../data/api-futures";
import { SURVEY_FORM_TYPES } from "../entities/Survey";
import { Id } from "../entities/Ref";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { getProgramId } from "../utils/PPSProgramsHelper";
import { Future } from "../entities/generic/Future";
import { ASTGUIDELINE_TYPES } from "../entities/ASTGuidelines";
import { ASTGuidelinesRepository } from "../repositories/ASTGuidelinesRepository";
import { ModuleRepository } from "../repositories/ModuleRepository";

export class DeleteSurveyUseCase {
    constructor(
        private surveyReporsitory: SurveyRepository,
        private astGuidelinesRepository: ASTGuidelinesRepository,
        private moduleRepository: ModuleRepository
    ) {}

    public execute(
        surveyFormType: SURVEY_FORM_TYPES,
        orgUnitId: Id,
        id: Id,
        astGuidelineType?: ASTGUIDELINE_TYPES,
        parentSurveyId?: Id
    ): FutureData<void> {
        return this.moduleRepository
            .getAll()
            .flatMap(modules => {
                const programId = getProgramId(surveyFormType, parentSurveyId, modules);

                return Future.success(programId);
            })
            .flatMap(programId => {
                return this.surveyReporsitory.deleteSurvey(id, orgUnitId, programId).flatMap(() => {
                    if (
                        surveyFormType === "PrevalenceSurveyForm" &&
                        astGuidelineType === "CUSTOM"
                    ) {
                        return this.astGuidelinesRepository
                            .deleteCustomASTGuideline(id)
                            .flatMap((deleted: boolean) => {
                                if (deleted) return Future.success(undefined);
                                else
                                    return Future.error(
                                        new Error(
                                            "Error deleting the custom AST guideline in datastore"
                                        )
                                    );
                            });
                    } else return Future.success(undefined);
                });
            });
    }
}
