import { useCallback, useEffect, useMemo, useState } from "react";
import { FormValue, WardForm } from "../../../../domain/entities/Questionnaire/WardForm";
import { WardStatisticsFormType } from "../../../../domain/entities/Survey";
import { useAppContext } from "../../../contexts/app-context";
import { Maybe } from "../../../../utils/ts-utils";
import { Id } from "../../../../domain/entities/Ref";
import { getCellId } from "../WardSummarySection";
import { palette } from "../../../pages/app/themes/dhis2.theme";
import { OrgUnitAccess } from "../../../../domain/entities/User";
import { WardEvent } from "../../../../domain/entities/Questionnaire/WardEvent";
import { useOfflineSnackbar } from "../../../hooks/useOfflineSnackbar";
import i18n from "../../../../utils/i18n";

export enum SAVE_FORM_STATE {
    ERROR = "error",
    IDLE = "idle",
    SAVING = "saving",
    SUCCESS = "success",
}

export function useWardSummaryForm(wardFormType: WardStatisticsFormType) {
    const { compositionRoot } = useAppContext();
    const { snackbar, offlineError } = useOfflineSnackbar();

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

        // Failed cells stay highlighted until they are saved successfully
        cellSaveStates.forEach((state, cellId) => {
            if (state === SAVE_FORM_STATE.SUCCESS) {
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

    const hasUnsavedValues = useMemo(
        () =>
            Array.from(cellSaveStates.values()).some(
                state => state === SAVE_FORM_STATE.SAVING || state === SAVE_FORM_STATE.ERROR
            ),
        [cellSaveStates]
    );

    useEffect(() => {
        if (!hasUnsavedValues) return;

        const warnBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", warnBeforeUnload);

        return () => window.removeEventListener("beforeunload", warnBeforeUnload);
    }, [hasUnsavedValues]);

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
                .execute(currentOrgUnit.orgUnitId, selectedPeriod, wardEventDetails, wardFormType)
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
    }, [
        currentOrgUnit,
        selectedPeriod,
        compositionRoot.surveys,
        wardEvents,
        selectedRootSurvey,
        wardFormType,
    ]);

    const rootSurveyOptions = useMemo(
        () =>
            wardEvents?.map(wardEvent => ({
                id: wardEvent.rootSurveyId,
                name: wardEvent.rootSurveyName,
            })) ?? [],
        [wardEvents]
    );

    const wardIdIssues = useMemo(
        () =>
            wardEvents?.find(wardEvent => wardEvent.rootSurveyId === selectedRootSurvey)
                ?.wardIdIssues,
        [wardEvents, selectedRootSurvey]
    );

    const getCellBackgroundColor = useCallback(
        (formValue: FormValue) => {
            const cellState =
                currentOrgUnit && selectedPeriod
                    ? cellSaveStates.get(
                          getCellStateKey(currentOrgUnit.orgUnitId, selectedPeriod, formValue)
                      )
                    : undefined;
            const stateKey = cellState?.toLowerCase() || "idle";

            return stateKey in palette.status
                ? palette.status[stateKey as keyof typeof palette.status]
                : "transparent";
        },
        [cellSaveStates, currentOrgUnit, selectedPeriod]
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
            compositionRoot.surveys.getWardEvents.execute(orgUnit, wardFormType).run(
                wardEvents => {
                    setWardEvents(wardEvents);
                    setCurrentOrgUnit(orgUnit);
                    if (wardEvents.length === 1) setSelectedRootSurvey(wardEvents[0]?.rootSurveyId);
                    setLoading(false);
                },
                error => {
                    setError(error.message);
                    setLoading(false);
                }
            );
        },
        [compositionRoot.surveys.getWardEvents, wardFormType]
    );

    const updateCellSaveState = useCallback((cellStateKey: string, state: SAVE_FORM_STATE) => {
        setCellSaveStates(prev => {
            const newMap = new Map(prev);
            newMap.set(cellStateKey, state);

            return newMap;
        });
    }, []);

    const saveWardSummaryForm = useCallback(
        (newValue: Maybe<string>, formValue: FormValue) => {
            if (!currentOrgUnit?.orgUnitId || !selectedPeriod) {
                setError("Missing facility or period information");
                return;
            }

            const cellStateKey = getCellStateKey(
                currentOrgUnit.orgUnitId,
                selectedPeriod,
                formValue
            );
            if (newValue !== undefined && !isWholeNumber(newValue)) {
                updateCellSaveState(cellStateKey, SAVE_FORM_STATE.ERROR);
                snackbar.error(
                    i18n.t("Only whole numbers of 0 or more are allowed. The value was not saved.")
                );
                return;
            }

            updateCellSaveState(cellStateKey, SAVE_FORM_STATE.SAVING);

            const formValueToSave = { ...formValue, value: newValue ?? "" };
            compositionRoot.surveys.saveWardForm
                .execute(formValueToSave, currentOrgUnit.orgUnitId, selectedPeriod, wardFormType)
                .run(
                    () => {
                        updateCellSaveState(cellStateKey, SAVE_FORM_STATE.SUCCESS);
                    },
                    error => {
                        console.error("Error saving ward summary form:", error);
                        updateCellSaveState(cellStateKey, SAVE_FORM_STATE.ERROR);
                        offlineError(
                            i18n.t(
                                "A value could not be saved: {{reason}}. Cells that failed are highlighted in red, please re-enter them.",
                                { reason: error.message }
                            )
                        );
                    }
                );
        },
        [
            updateCellSaveState,
            currentOrgUnit,
            selectedPeriod,
            compositionRoot.surveys.saveWardForm,
            wardFormType,
            snackbar,
            offlineError,
        ]
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
        wardIdIssues: wardIdIssues,
        hasUnsavedValues: hasUnsavedValues,
        getCellBackgroundColor: getCellBackgroundColor,
        saveCurrentOrgUnit: saveCurrentOrgUnit,
        saveWardSummaryForm: saveWardSummaryForm,
        updateRootSurvey: updateRootSurvey,
        updateWardSummaryPeriod: updateWardSummaryPeriod,
    };
}

// The ward statistics are counts, so decimals and negatives are rejected before saving
function isWholeNumber(value: string): boolean {
    return /^\d+$/.test(value);
}

// Cell ids repeat across periods and facilities, so save states are kept per facility and period
function getCellStateKey(orgUnitId: Id, period: string, formValue: FormValue): string {
    return `${orgUnitId}-${period}-${getCellId(formValue)}`;
}
