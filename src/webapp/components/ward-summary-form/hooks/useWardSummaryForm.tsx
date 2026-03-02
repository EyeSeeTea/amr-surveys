import { useCallback, useEffect, useMemo, useState } from "react";
import { FormValue, WardForm } from "../../../../domain/entities/Questionnaire/WardForm";
import { useAppContext } from "../../../contexts/app-context";
import { Maybe } from "../../../../utils/ts-utils";
import { Id } from "../../../../domain/entities/Ref";
import { getCellId } from "../WardSummarySection";
import { palette } from "../../../pages/app/themes/dhis2.theme";
import { OrgUnitAccess } from "../../../../domain/entities/User";
import { WardEvent } from "../../../../domain/entities/Questionnaire/WardEvent";

export enum SAVE_FORM_STATE {
    ERROR = "error",
    IDLE = "idle",
    SAVING = "saving",
    SUCCESS = "success",
}

export function useWardSummaryForm() {
    const { compositionRoot } = useAppContext();

    const [cellSaveStates, setCellSaveStates] = useState<Map<string, SAVE_FORM_STATE>>(new Map());
    const [currentOrgUnit, setCurrentOrgUnit] = useState<OrgUnitAccess>();
    const [wardEvents, setWardEvents] = useState<WardEvent[]>();
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedRootSurvey, setSelectedRootSurvey] = useState<Id>();
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
        if (currentOrgUnit?.orgUnitId && selectedPeriod && wardEvents) {
            const wardEventDetails = wardEvents.find(
                wardEvent => wardEvent.rootSurveyId === selectedRootSurvey
            )?.events;

            if (!wardEventDetails) {
                setError("No ward event found for the selected root survey");
                return;
            }
            setLoading(true);
            compositionRoot.surveys.getWardForm
                .execute(currentOrgUnit.orgUnitId, selectedPeriod, wardEventDetails)
                .run(
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
    }, [currentOrgUnit, selectedPeriod, compositionRoot.surveys, wardEvents, selectedRootSurvey]);

    const rootSurveyOptions = useMemo(
        () =>
            wardEvents?.map(wardEvent => ({
                id: wardEvent.rootSurveyId,
                name: wardEvent.rootSurveyName,
            })) ?? [],
        [wardEvents]
    );

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

    const saveCurrentOrgUnit = useCallback(
        (orgUnit: Maybe<OrgUnitAccess>) => {
            if (!orgUnit) return;

            setSelectedPeriod(undefined);
            setSelectedRootSurvey(undefined);
            setWardSummaryForm([]);
            setWardEvents(undefined);
            setError(undefined);
            setLoading(true);
            compositionRoot.surveys.getWardEvents.execute(orgUnit).run(
                wardEvents => {
                    setWardEvents(wardEvents);
                    setCurrentOrgUnit(orgUnit);
                    setLoading(false);
                },
                error => {
                    setError(error.message);
                    setLoading(false);
                }
            );
        },
        [compositionRoot.surveys.getWardEvents]
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
            if (!currentOrgUnit?.orgUnitId || !selectedPeriod) {
                setError("Missing facility or period information");
                return;
            }

            updateCellSaveState(formValue, SAVE_FORM_STATE.SAVING);

            const formValueToSave = { ...formValue, value: newValue ?? "" };
            compositionRoot.surveys.saveWardForm
                .execute(formValueToSave, currentOrgUnit.orgUnitId, selectedPeriod)
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
        [updateCellSaveState, currentOrgUnit, selectedPeriod, compositionRoot.surveys.saveWardForm]
    );

    const updateWardSummaryPeriod = useCallback((period: Maybe<Id>) => {
        if (period) {
            setSelectedPeriod(period);
        }
    }, []);

    const updateRootSurvey = useCallback((rootSurveyId: Maybe<Id>) => {
        if (rootSurveyId) {
            setSelectedRootSurvey(rootSurveyId);
        }
    }, []);

    return {
        currentOrgUnit: currentOrgUnit,
        wardEvents: wardEvents,
        error: error,
        loading: loading,
        rootSurveyOptions: rootSurveyOptions,
        selectedPeriod: selectedPeriod,
        selectedRootSurvey: selectedRootSurvey,
        wardSummaryForms: wardSummaryForms,
        getCellBackgroundColor: getCellBackgroundColor,
        saveCurrentOrgUnit: saveCurrentOrgUnit,
        saveWardSummaryForm: saveWardSummaryForm,
        updateRootSurvey: updateRootSurvey,
        updateWardSummaryPeriod: updateWardSummaryPeriod,
    };
}
