import { FutureData } from "../../data/api-futures";
import { Id } from "../entities/Ref";
import { ASTGUIDELINE_TYPES, CurrentASTGuidelines } from "../entities/ASTGuidelines";

export interface ASTGuidelinesRepository {
    getByASTGuidelineType(
        astGuidelineType: ASTGUIDELINE_TYPES,
        surveyId?: Id
    ): FutureData<CurrentASTGuidelines>;

    saveByASTGuidelineType(astGuidelineType: ASTGUIDELINE_TYPES, surveyId: Id): FutureData<void>;
}
