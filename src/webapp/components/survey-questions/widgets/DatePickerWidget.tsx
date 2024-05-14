import React from "react";
// @ts-ignore
import { Maybe } from "../../../../types/utils";
import { BaseWidgetProps } from "./BaseWidget";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

export interface DatePickerWidgetProps extends BaseWidgetProps<Date> {
    value: Maybe<Date>;
    name: string;
}

const DatePickerWidget: React.FC<DatePickerWidgetProps> = props => {
    const { onChange: onValueChange, value } = props;

    const [stateValue, setStateValue] = React.useState(value);
    React.useEffect(() => setStateValue(value), [value]);

    const notifyChange = React.useCallback(
        (newValue: Date) => {
            setStateValue(newValue);
            onValueChange(newValue);
        },
        [onValueChange]
    );
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
                key={props.name}
                value={stateValue}
                disabled={props.disabled}
                onChange={newValue => notifyChange(newValue)}
            />
        </LocalizationProvider>
    );
};

export default React.memo(DatePickerWidget);
