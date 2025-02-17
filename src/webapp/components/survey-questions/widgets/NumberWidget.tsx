import React from "react";
// @ts-ignore
import { Input } from "@dhis2/ui";
import { BaseWidgetProps } from "./BaseWidget";

import { Maybe } from "../../../../utils/ts-utils";
import {
    NumberQuestion,
    QuestionnaireQuestion,
} from "../../../../domain/entities/Questionnaire/QuestionnaireQuestion";

export interface NumberWidgetProps extends BaseWidgetProps<string> {
    value: Maybe<string>;
    numberType: NumberQuestion["numberType"];
}

const NumberWidget: React.FC<NumberWidgetProps> = props => {
    const { onChange: onValueChange, value, numberType } = props;

    const [stateValue, setStateValue] = React.useState(value);
    const [inputKey, setInputKey] = React.useState(0);

    React.useEffect(() => setStateValue(value), [value]);
    const updateState = React.useCallback(({ value }: { value: string }) => {
        setStateValue(value);
    }, []);

    const notifyChange = React.useCallback(
        ({ value: newValue }: { value: string }) => {
            if (newValue === "") {
                // change the key in case of "" value, which could mean invalid number for the input
                setInputKey(inputKey + 1);
            }
            if (!isValidNumberValue(newValue, numberType)) {
                setStateValue(value);
            } else if (value !== newValue) {
                onValueChange(newValue);
            }
        },
        [onValueChange, value, numberType, setInputKey, inputKey]
    );

    return (
        <>
            <Input
                // HACK: use a key to force resetting the input value
                // input was not updated when in invalid state and stateValue changed to ""
                key={inputKey}
                type="number"
                onBlur={notifyChange}
                onChange={updateState}
                value={stateValue || ""}
                disabled={props.disabled}
            />
        </>
    );
};

const { isValidNumberValue } = QuestionnaireQuestion;

export default React.memo(NumberWidget);
