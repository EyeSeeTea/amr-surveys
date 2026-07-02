import React from "react";
// @ts-ignore
import { Input, TextArea } from "@dhis2/ui";
import { BaseWidgetProps } from "./BaseWidget";
import { Maybe } from "../../../../utils/ts-utils";

export interface TextWidgetProps extends BaseWidgetProps<string> {
    value: Maybe<string>;
    multiline: boolean;
    placeholder?: string;
}

const TextWidget: React.FC<TextWidgetProps> = props => {
    const { onChange: onValueChange, value, placeholder } = props;

    const [stateValue, setStateValue] = React.useState(value);
    React.useEffect(() => setStateValue(value), [value]);

    const handleChange = React.useCallback(
        ({ value: newValue }: { value: string }) => {
            setStateValue(newValue);
            if (value !== newValue) onValueChange(newValue);
        },
        [onValueChange, value]
    );

    return (
        <>
            {props.multiline ? (
                <TextArea
                    onChange={handleChange}
                    value={stateValue || ""}
                    disabled={props.disabled}
                />
            ) : (
                <Input
                    placeholder={placeholder}
                    onChange={handleChange}
                    value={stateValue || ""}
                    disabled={props.disabled}
                />
            )}
        </>
    );
};

export default React.memo(TextWidget);
