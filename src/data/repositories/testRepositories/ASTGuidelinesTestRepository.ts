import { Future } from "../../../domain/entities/generic/Future";
import { ASTGuidelinesRepository } from "../../../domain/repositories/ASTGuidelinesRepository";
import { ASTGUIDELINE_TYPES, CurrentASTGuidelines } from "../../../domain/entities/ASTGuidelines";
import { FutureData } from "../../api-futures";

export class ASTGuidelinesTestRepository implements ASTGuidelinesRepository {
    deleteCustomASTGuideline(surveyId: string): FutureData<boolean> {
        console.debug("deleteCustomASTGuideline", surveyId);
        throw new Error("Method not implemented.");
    }
    saveByASTGuidelineType(
        astGuidelineType: ASTGUIDELINE_TYPES,
        surveyId: string
    ): FutureData<void> {
        console.debug("saveByASTGuidelineType", astGuidelineType, surveyId);
        return Future.success(undefined);
    }
    getByASTGuidelineType(): FutureData<CurrentASTGuidelines> {
        return Future.success({
            type: "CLSI",
            lists: new Map(),
            matrix: new Map(),
        });
    }
}
