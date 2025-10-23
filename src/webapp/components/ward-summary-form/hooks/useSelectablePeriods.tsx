import { useMemo } from "react";

export function useSelectablePeriods() {
    const selectablePeriods = useMemo(() => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        return Array.from({ length: currentMonth + 1 }, (_, i) => {
            const date = new Date(currentYear, i, 1);
            const monthName = date.toLocaleString("en-US", { month: "long" });
            const monthNumber = (i + 1).toString().padStart(2, "0");

            return {
                id: `${currentYear}${monthNumber}`,
                name: `${monthName} ${currentYear}`,
            };
        });
    }, []);

    return selectablePeriods;
}
