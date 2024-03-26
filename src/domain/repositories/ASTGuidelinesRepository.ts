import { FutureData } from "../../data/api-futures";
import { ASTGuidelinesContextState } from "../../webapp/contexts/ast-guidelines-context";

export interface ASTGuidelinesRepository {
    getAll(): FutureData<ASTGuidelinesContextState>;
}
