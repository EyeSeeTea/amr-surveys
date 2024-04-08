import { DataStoreClient } from "../DataStoreClient";
import { ASTGuidelinesRepository } from "../../domain/repositories/ASTGuidelinesRepository";
import { ASTGuidelinesContextState } from "../../webapp/contexts/ast-guidelines-context";
import { FutureData } from "../api-futures";
import { DataStoreKeys } from "../DataStoreKeys";

export class ASTGuidelinesD2Repository implements ASTGuidelinesRepository {
    constructor(private dataStoreClient: DataStoreClient) {}
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
                                    const CLSI_Lists_map: Map<string, string[]> = new Map();
                                    Object.entries(CLSI_Lists).map(keyValue => {
                                        CLSI_Lists_map.set(keyValue[0], keyValue[1] as string[]);
                                    });

                                    const CLSI_Matrix_map: Map<string, string[]> = new Map();
                                    Object.entries(CLSI_matrix).map(keyValue => {
                                        CLSI_Matrix_map.set(keyValue[0], keyValue[1] as string[]);
                                    });

                                    const EUCAST_Lists_map: Map<string, string[]> = new Map();
                                    Object.entries(EUCAST_lists).map(keyValue => {
                                        EUCAST_Lists_map.set(keyValue[0], keyValue[1] as string[]);
                                    });

                                    const EUCAST_Matrix_map: Map<string, string[]> = new Map();
                                    Object.entries(EUCAST_matrix).map(keyValue => {
                                        EUCAST_Matrix_map.set(keyValue[0], keyValue[1] as string[]);
                                    });
                                    return {
                                        CLSI_lists: CLSI_Lists_map,
                                        CLSI_matrix: CLSI_Matrix_map,
                                        EUCAST_lists: EUCAST_Lists_map,
                                        EUCAST_matrix: EUCAST_Matrix_map,
                                    };
                                });
                        });
                });
        });
    }
}
