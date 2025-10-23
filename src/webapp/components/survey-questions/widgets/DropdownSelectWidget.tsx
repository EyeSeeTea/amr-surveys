import React, { useCallback } from "react";
import { BaseWidgetProps } from "./BaseWidget";
import { FormControl, InputLabel, makeStyles, MenuItem, Select } from "@material-ui/core";
import { Maybe } from "../../../../utils/ts-utils";
import { Id, NamedRef } from "../../../../domain/entities/Ref";

export interface SingleSelectWidgetProps extends BaseWidgetProps<Id> {
    value: Maybe<Id>;
    options: Option[];
    label?: string;
    onChange: (selectedId: Maybe<Id>) => void;
}

type Option = NamedRef;

const DropdownSelectWidget: React.FC<SingleSelectWidgetProps> = props => {
    const { onChange: onValueChange, value, options, disabled, label } = props;

    const notifyChange = useCallback(
        (selectedId: Maybe<Id>) => onValueChange(selectedId),
        [onValueChange]
    );

    const classes = useStyles();

    return (
        <FormControl className={classes.horizontalWrapper}>
            <InputLabel className={classes.label} id="select-label">
                {label || ""}
            </InputLabel>

            <Select
                value={value ?? ""}
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
