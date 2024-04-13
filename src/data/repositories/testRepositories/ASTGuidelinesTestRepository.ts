import { Future } from "../../../domain/entities/generic/Future";
import { ASTGuidelinesRepository } from "../../../domain/repositories/ASTGuidelinesRepository";
import { CurrentASTGuidelines } from "../../../domain/entities/ASTGuidelines";
import { FutureData } from "../../api-futures";

export class ASTGuidelinesTestRepository implements ASTGuidelinesRepository {
    getByASTGuidelineType(): FutureData<CurrentASTGuidelines> {
        return Future.success({
            type: "CLSI",
            lists: new Map(),
            matrix: new Map(),
        });
    }
}
