import React, { useCallback, useState } from "react";
// @ts-ignore
import { Button } from "@dhis2/ui";
import { BaseWidgetProps } from "./BaseWidget";
import { FormControl, InputLabel, makeStyles, MenuItem, Select } from "@material-ui/core";
import { Maybe } from "../../../../utils/ts-utils";
import { Id, NamedRef } from "../../../../domain/entities/Ref";

export interface SingleSelectWidgetProps extends BaseWidgetProps<Option> {
    value: Maybe<Id>;
    options: Option[];
    label?: string;
}

type Option = NamedRef;

const DropdownSelectWidget: React.FC<SingleSelectWidgetProps> = props => {
    const { onChange: onValueChange, value, options, disabled, label } = props;

    const [stateValue, setStateValue] = useState(value);

    const notifyChange = useCallback(
        (selectedId: Maybe<Id>) => {
            const option = options.find(option => option.id === selectedId);
            setStateValue(selectedId);
            onValueChange(option);
        },
        [onValueChange, options]
    );

    const classes = useStyles();

    return (
        <FormControl className={classes.horizontalWrapper}>
            {label && (
                <InputLabel className={classes.label} id="select-label">
                    {label}
                </InputLabel>
            )}
            <Select
                value={stateValue}
                onChange={option => notifyChange(option.target.value as string)}
                disabled={disabled}
                labelId="select-label"
                className={classes.select}
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
        </FormControl>
    );
};

const useStyles = makeStyles({
    horizontalWrapper: {
        display: "flex",
        flexDirection: "row",
        alignItems: "end",
        width: "200px",
        gap: 10,
        paddingBlock: 15,
    },
    label: {
        paddingBlock: 15,
    },
    select: {
        width: "100%",
    },
});

export default React.memo(DropdownSelectWidget);
