import { useMemo } from "react";
import { WardEvent } from "../../../../domain/entities/Questionnaire/WardEvent";
import { Maybe } from "../../../../utils/ts-utils";
import { NamedRef } from "../../../../domain/entities/Ref";

type Period = NamedRef;

export function useSelectablePeriods(wardEvents: Maybe<WardEvent[]>): Period[] {
    const selectablePeriods = useMemo(() => {
        if (!wardEvents || wardEvents.length === 0) return [];

        return getPeriodsFromWardEvents(wardEvents);
    }, [wardEvents]);

    return selectablePeriods;
}

function getPeriodsFromWardEvents(wardEvents: WardEvent[]): Period[] {
    const eventDates = wardEvents.map(event => new Date(event.eventDate));
    const minDate = new Date(Math.min(...eventDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...eventDates.map(d => d.getTime())));

    const startYear = minDate.getFullYear();
    const startMonth = minDate.getMonth();
    const endYear = maxDate.getFullYear();
    const endMonth = maxDate.getMonth();

    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

    return Array.from({ length: totalMonths }, (_, i) => {
        const year = startYear + Math.floor((startMonth + i) / 12);
        const month = (startMonth + i) % 12;
        const date = new Date(year, month, 1);
        const monthName = date.toLocaleString("en-US", { month: "long" });
        const monthNumber = (month + 1).toString().padStart(2, "0");

        return {
            id: `${year}${monthNumber}`,
            name: `${monthName} ${year}`,
        };
    });
}
