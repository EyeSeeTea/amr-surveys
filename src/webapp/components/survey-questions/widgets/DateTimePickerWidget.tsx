import React from "react";
// @ts-ignore
import { Maybe } from "../../../../types/utils";
import { BaseWidgetProps } from "./BaseWidget";
import { DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers";

export interface DateTimePickerWidgetProps extends BaseWidgetProps<Date> {
    value: Maybe<Date>;
    name: string;
}

const DateTimePickerWidget: React.FC<DateTimePickerWidgetProps> = props => {
    const { onChange: onValueChange, value } = props;

    const [stateValue, setStateValue] = React.useState<string>(value);
    React.useEffect(() => setStateValue(value), [value]);

    const notifyChange = React.useCallback(
        (newValue: Maybe<Date>) => {
            setStateValue(newValue);
            onValueChange(newValue || "");
        },
        [onValueChange]
    );
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
                key={props.name}
                value={stateValue ? new Date(stateValue) : undefined}
                disabled={props.disabled}
                onChange={newValue => notifyChange(newValue)}
                ampm={false}
                format="dd-MM-yyyy HH:mm"
            />
        </LocalizationProvider>
    );
};

export default React.memo(DateTimePickerWidget);
