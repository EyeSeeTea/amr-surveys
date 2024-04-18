import { Future } from "../../../domain/entities/generic/Future";
import { ASTGuidelinesRepository } from "../../../domain/repositories/ASTGuidelinesRepository";
import { ASTGuidelinesContextState } from "../../../webapp/contexts/ast-guidelines-context";
import { FutureData } from "../../api-futures";

export class ASTGuidelinesTestRepository implements ASTGuidelinesRepository {
    getAll(): FutureData<ASTGuidelinesContextState> {
        return Future.success({
            CLSI_lists: new Map(),
            CLSI_matrix: new Map(),
            EUCAST_lists: new Map(),
            EUCAST_matrix: new Map(),
        });
    }
}
