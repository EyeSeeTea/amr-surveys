import { D2Api } from "@eyeseetea/d2-api/2.36";
import { DataStoreClient } from "../DataStoreClient";
import { ASTGuidelinesRepository } from "../../domain/repositories/ASTGuidelinesRepository";
import { ASTGuidelinesContextState } from "../../webapp/contexts/ast-guidelines-context";
import { FutureData } from "../api-futures";
import { DataStoreKeys } from "../DataStoreKeys";

export class ASTGuidelinesD2Repository implements ASTGuidelinesRepository {
    constructor(private dataStoreClient: DataStoreClient, private api: D2Api) {}
    getAll(): FutureData<ASTGuidelinesContextState> {
        return this.dataStoreClient.listCollection(DataStoreKeys.CLSI_LISTS).flatMap(CLSI_Lists => {
            return this.dataStoreClient
                .listCollection(DataStoreKeys.CLSI_MATRIX)
                .flatMap(CLSI_matrix => {
                    return this.dataStoreClient
                        .listCollection(DataStoreKeys.EUCAST_LISTS)
                        .flatMap(EUCAST_lists => {
                            return this.dataStoreClient
                                .listCollection(DataStoreKeys.EUCAST_MATRIX)
                                .map(EUCAST_matrix => {
                                    return {
                                        CLSI_lists: CLSI_Lists,
                                        CLSI_matrix: CLSI_matrix,
                                        EUCAST_lists: EUCAST_lists,
                                        EUCAST_matrix: EUCAST_matrix,
                                    } as unknown as ASTGuidelinesContextState;
                                });
                        });
                });
        });
    }
}
