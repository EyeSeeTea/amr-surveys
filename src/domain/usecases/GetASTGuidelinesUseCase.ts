import { FutureData } from "../../data/api-futures";
import _ from "../entities/generic/Collection";
import { ASTGuidelinesContextState } from "../../webapp/contexts/ast-guidelines-context";
import { ASTGuidelinesRepository } from "../repositories/ASTGuidelinesRepository";

export class GetASTGuidelinesUseCase {
    constructor(private astGuidelinesRepository: ASTGuidelinesRepository) {}

    public execute(): FutureData<ASTGuidelinesContextState> {
        return this.astGuidelinesRepository.getAll();
    }
}
