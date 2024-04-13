import { FutureData } from "../../data/api-futures";
import { ASTGUIDELINE_TYPES, CurrentASTGuidelines } from "../entities/ASTGuidelines";
import { Id } from "../entities/Ref";
import _ from "../entities/generic/Collection";
import { ASTGuidelinesRepository } from "../repositories/ASTGuidelinesRepository";

export class GetASTGuidelinesUseCase {
    constructor(private astGuidelinesRepository: ASTGuidelinesRepository) {}

    public execute(
        astGuidelineType: ASTGUIDELINE_TYPES,
        surveyId?: Id
    ): FutureData<CurrentASTGuidelines> {
        return this.astGuidelinesRepository.getByASTGuidelineType(astGuidelineType, surveyId);
    }
}
