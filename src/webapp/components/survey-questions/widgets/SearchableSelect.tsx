import React from "react";
import { BaseWidgetProps } from "./BaseWidget";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export interface SearchableSelectProps extends BaseWidgetProps<Option> {
    value: Option | null;
    options: Option[];
}

type Option = { id: string; name: string };

const SearchableSelect: React.FC<SearchableSelectProps> = props => {
    const { onChange: onValueChange, value, options } = props;

    const [stateValue, setStateValue] = React.useState(value);
    React.useEffect(() => setStateValue(value), [value]);

    const notifyChange = React.useCallback(
        (selectedOption: Option | null) => {
            const option = options.find(option => option.id === selectedOption?.id);
            setStateValue(selectedOption);
            onValueChange(option);
        },
        [onValueChange, options]
    );

    return (
        <Autocomplete
            value={stateValue}
            onChange={(_e, newValue) => notifyChange(newValue)}
            getOptionLabel={option => option.name}
            disablePortal
            options={options}
            sx={{ width: 300 }}
            renderInput={params => <TextField {...params} label="Select..." />}
        />
    );
};

export default React.memo(SearchableSelect);
