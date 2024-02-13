import React from "react";
// @ts-ignore
import { Button } from "@dhis2/ui";
import { BaseWidgetProps } from "./BaseWidget";
import { makeStyles, MenuItem, Select } from "@material-ui/core";
import { Maybe } from "../../../../utils/ts-utils";
import { Id } from "../../../../domain/entities/Ref";

export interface SingleSelectWidgetProps extends BaseWidgetProps<Option> {
    value: Maybe<Id>;
    options: Option[];
}

type Option = { id: string; name: string };

const DropdownSelectWidget: React.FC<SingleSelectWidgetProps> = props => {
    const { onChange: onValueChange, value, options, disabled } = props;

    const [stateValue, setStateValue] = React.useState(value);
    React.useEffect(() => setStateValue(value), [value]);

    const notifyChange = React.useCallback(
        (selectedId: Maybe<Id>) => {
            const option = options.find(option => option.id === selectedId);
            setStateValue(selectedId);
            onValueChange(option);
        },
        [onValueChange, options]
    );

    const classes = useStyles();

    return (
        <div className={classes.horizontalWrapper}>
            <Select
                value={stateValue}
                onChange={option => notifyChange(option.target.value as string)}
                disabled={disabled}
            >
                {options.map(option => (
                    <MenuItem key={option.id} value={option.id}>
                        {option.name}
                    </MenuItem>
                ))}
            </Select>
            <Button
                small
                onClick={() => notifyChange(undefined)}
                tabIndex="-1"
                disabled={props.disabled}
            >
                ✕
            </Button>
        </div>
    );
};

const useStyles = makeStyles({
    horizontalWrapper: { display: "flex", gap: 10, padding: 5 },
});

export default React.memo(DropdownSelectWidget);
