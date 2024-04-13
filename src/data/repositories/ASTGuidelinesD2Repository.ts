import { DataStoreClient } from "../DataStoreClient";
import { ASTGuidelinesRepository } from "../../domain/repositories/ASTGuidelinesRepository";
import { FutureData } from "../api-futures";
import { DataStoreKeys } from "../DataStoreKeys";
import { CurrentASTGuidelines, ASTGUIDELINE_TYPES } from "../../domain/entities/ASTGuidelines";
import { Id } from "../../domain/entities/Ref";
import { Future } from "../../domain/entities/generic/Future";

export class ASTGuidelinesD2Repository implements ASTGuidelinesRepository {
    constructor(private dataStoreClient: DataStoreClient) {}
    getByASTGuidelineType(
        astGuidelineType: ASTGUIDELINE_TYPES,
        surveyId?: Id
    ): FutureData<CurrentASTGuidelines> {
        switch (astGuidelineType) {
            case "CLSI": {
                return this.dataStoreClient
                    .listCollection(DataStoreKeys.CLSI_LISTS)
                    .flatMap(CLSI_Lists => {
                        return this.dataStoreClient
                            .listCollection(DataStoreKeys.CLSI_MATRIX)
                            .map(CLSI_matrix => {
                                const CLSI_Lists_map: Map<string, string[]> = new Map();
                                Object.entries(CLSI_Lists).map(keyValue => {
                                    CLSI_Lists_map.set(keyValue[0], keyValue[1] as string[]);
                                });

                                const CLSI_Matrix_map: Map<string, string[]> = new Map();
                                Object.entries(CLSI_matrix).map(keyValue => {
                                    CLSI_Matrix_map.set(keyValue[0], keyValue[1] as string[]);
                                });

                                return {
                                    type: astGuidelineType,
                                    lists: CLSI_Lists_map,
                                    matrix: CLSI_Matrix_map,
                                };
                            });
                    });
            }

            case "EUCAST": {
                return this.dataStoreClient
                    .listCollection(DataStoreKeys.EUCAST_LISTS)
                    .flatMap(EUCAST_lists => {
                        return this.dataStoreClient
                            .listCollection(DataStoreKeys.EUCAST_MATRIX)
                            .map(EUCAST_matrix => {
                                const EUCAST_Lists_map: Map<string, string[]> = new Map();
                                Object.entries(EUCAST_lists).map(keyValue => {
                                    EUCAST_Lists_map.set(keyValue[0], keyValue[1] as string[]);
                                });

                                const EUCAST_Matrix_map: Map<string, string[]> = new Map();
                                Object.entries(EUCAST_matrix).map(keyValue => {
                                    EUCAST_Matrix_map.set(keyValue[0], keyValue[1] as string[]);
                                });

                                return {
                                    type: astGuidelineType,
                                    lists: EUCAST_Lists_map,
                                    matrix: EUCAST_Matrix_map,
                                };
                            });
                    });
            }

            case "CUSTOM": {
                if (!surveyId) {
                    return Future.error(
                        new Error("Survey ID is required for CUSTOM AST Guideline")
                    );
                }
                return this.dataStoreClient
                    .listCollection(`${DataStoreKeys.CUSTOM_LISTS}_${surveyId}`)
                    .flatMap(custom_lists => {
                        return this.dataStoreClient
                            .listCollection(`${DataStoreKeys.CUSTOM_MATRIX}_${surveyId}`)
                            .map(custom_matrix => {
                                const customListsMap: Map<string, string[]> = new Map();
                                Object.entries(custom_lists).map(keyValue => {
                                    customListsMap.set(keyValue[0], keyValue[1] as string[]);
                                });

                                const customMatrixMap: Map<string, string[]> = new Map();
                                Object.entries(custom_matrix).map(keyValue => {
                                    customMatrixMap.set(keyValue[0], keyValue[1] as string[]);
                                });

                                return {
                                    type: astGuidelineType,
                                    surveyId: surveyId,
                                    lists: customListsMap,
                                    matrix: customMatrixMap,
                                };
                            });
                    });
            }

            default: {
                return Future.error(new Error("Invalid AST Guideline type"));
            }
        }
    }
}
