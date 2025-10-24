import { useCallback, useEffect, useState } from "react";
import { FormValue, WardForm } from "../../../../domain/entities/Questionnaire/WardForm";
import { useAppContext } from "../../../contexts/app-context";
import { Maybe } from "../../../../utils/ts-utils";
import { Id } from "../../../../domain/entities/Ref";
import { getCellId } from "../WardSummarySection";
import { palette } from "../../../pages/app/themes/dhis2.theme";

export enum SAVE_FORM_STATE {
    ERROR = "error",
    IDLE = "idle",
    SAVING = "saving",
    SUCCESS = "success",
}

export function useWardSummaryForm(currentOrgUnitId: Maybe<Id>) {
    const { compositionRoot } = useAppContext();

    const [cellSaveStates, setCellSaveStates] = useState<Map<string, SAVE_FORM_STATE>>(new Map());
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedPeriod, setSelectedPeriod] = useState<string>();
    const [wardSummaryForms, setWardSummaryForm] = useState<WardForm[]>([]);

    useEffect(() => {
        const timeouts: ReturnType<typeof setTimeout>[] = [];

        cellSaveStates.forEach((state, cellId) => {
            if (state === SAVE_FORM_STATE.SUCCESS || state === SAVE_FORM_STATE.ERROR) {
                const timeout = setTimeout(() => {
                    setCellSaveStates(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(cellId);

                        return newMap;
                    });
                }, 5000); // 5 seconds

                timeouts.push(timeout);
            }
        });

        return () => {
            timeouts.forEach(timeout => clearTimeout(timeout));
        };
    }, [cellSaveStates]);

    useEffect(() => {
        if (currentOrgUnitId && selectedPeriod) {
            setLoading(true);
            compositionRoot.surveys.getWardForm.execute(currentOrgUnitId, selectedPeriod).run(
                wardSummaryForm => {
                    setWardSummaryForm(wardSummaryForm);
                    setLoading(false);
                },
                err => {
                    setError(err.message);
                    setLoading(false);
                }
            );
        }
    }, [currentOrgUnitId, selectedPeriod, compositionRoot.surveys]);

    const getCellBackgroundColor = useCallback(
        (formValue: FormValue) => {
            const cellId = getCellId(formValue);
            const cellState = cellSaveStates.get(cellId);
            const stateKey = cellState?.toLowerCase() || "idle";

            return stateKey in palette.status
                ? palette.status[stateKey as keyof typeof palette.status]
                : "transparent";
        },
        [cellSaveStates]
    );

    const updateCellSaveState = useCallback((formValue: FormValue, state: SAVE_FORM_STATE) => {
        setCellSaveStates(prev => {
            const cellId = getCellId(formValue);
            const newMap = new Map(prev);
            newMap.set(cellId, state);

            return newMap;
        });
    }, []);

    const saveWardSummaryForm = useCallback(
        (newValue: Maybe<string>, formValue: FormValue) => {
            if (!currentOrgUnitId || !selectedPeriod) {
                setError("Missing facility or period information");
                return;
            }

            updateCellSaveState(formValue, SAVE_FORM_STATE.SAVING);

            const formValueToSave = { ...formValue, value: newValue ?? "" };
            compositionRoot.surveys.saveWardForm
                .execute(formValueToSave, currentOrgUnitId, selectedPeriod)
                .run(
                    () => {
                        updateCellSaveState(formValue, SAVE_FORM_STATE.SUCCESS);
                    },
                    error => {
                        console.error("Error saving ward summary form:", error);
                        updateCellSaveState(formValue, SAVE_FORM_STATE.ERROR);
                    }
                );
        },
        [
            updateCellSaveState,
            currentOrgUnitId,
            selectedPeriod,
            compositionRoot.surveys.saveWardForm,
        ]
    );

    const updateWardSummaryPeriod = useCallback((period: Maybe<Id>) => {
        if (period) {
            setSelectedPeriod(period);
        }
    }, []);

    return {
        error: error,
        loading: loading,
        selectedPeriod: selectedPeriod,
        wardSummaryForms: wardSummaryForms,
        getCellBackgroundColor: getCellBackgroundColor,
        saveWardSummaryForm: saveWardSummaryForm,
        updateWardSummaryPeriod: updateWardSummaryPeriod,
    };
}
