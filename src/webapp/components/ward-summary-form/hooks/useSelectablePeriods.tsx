import { useMemo } from "react";
import { WardEvent } from "../../../../domain/entities/Questionnaire/WardEvent";
import { Maybe } from "../../../../utils/ts-utils";
import { Id, NamedRef } from "../../../../domain/entities/Ref";

type Period = NamedRef;

export function useSelectablePeriods(
    rootSurveyId: Maybe<Id>,
    wardEvents: Maybe<WardEvent[]>
): Period[] {
    const selectablePeriods = useMemo(() => {
        const rootSurvey = wardEvents?.find(wardEvent => wardEvent.rootSurveyId === rootSurveyId);
        if (!rootSurvey) return [];

        return getPeriodsFromWardEvent(rootSurvey);
    }, [rootSurveyId, wardEvents]);

    return selectablePeriods;
}

function getPeriodsFromWardEvent(rootSurvey: WardEvent): Period[] {
    const { startDate } = rootSurvey;
    const baseYear = startDate.getFullYear();
    const baseMonth = startDate.getMonth() - 1;

    return Array.from({ length: 20 }, (_, i) => {
        const year = baseYear + Math.floor((baseMonth + i) / 12);
        const month = (baseMonth + i + 12) % 12;
        const date = new Date(year, month, 1);
        const monthName = date.toLocaleString("en-US", { month: "long" });
        const monthNumber = (month + 1).toString().padStart(2, "0");

        return {
            id: `${year}${monthNumber}`,
            name: i === 0 ? "Total" : `${monthName} ${year}`,
        };
    }).sort((a, b) => (a.name === "Total" ? 1 : b.name === "Total" ? -1 : 0));
}
