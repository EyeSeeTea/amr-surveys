import styled from "styled-components";
import { Maybe } from "../../../utils/ts-utils";
import React from "react";

type DataElementItemProps = {
    backgroundColor?: string;
    dataValue: Maybe<string>;
    disabled?: boolean;
    onChange: (value: Maybe<string>) => void;
};

const DataElementCell: React.FC<DataElementItemProps> = props => {
    const { backgroundColor, dataValue, disabled, onChange: notifyChange } = props;

    const handleChange = (value: string) => {
        const numericValue = value.trim();
        if (numericValue === "") {
            notifyChange(undefined);
            return;
        }

        const parsed = parseInt(numericValue, 10);
        if (!isNaN(parsed) && parsed >= 0) {
            notifyChange(numericValue);
        }
    };

    return (
        <CustomInput
            type="number"
            onBlur={e => handleChange(e.target.value)}
            onKeyDown={e => {
                if (e.key === "Enter") {
                    handleChange((e.target as HTMLInputElement).value);
                }
            }}
            defaultValue={dataValue}
            disabled={disabled}
            style={{ backgroundColor: backgroundColor ?? "transparent" }}
        />
    );
};

export default React.memo(DataElementCell);

export const CustomInput = styled.input`
    width: 100%;
    box-sizing: border-box;
    font-size: 14px;
    line-height: 16px;
    user-select: text;
    color: rgb(33, 41, 52);
    background-color: white;
    padding: 12px 11px 10px;
    outline: 0px;
    border: 1px solid rgb(160, 173, 186);
    border-radius: 3px;
    box-shadow: rgba(48, 54, 60, 0.1) 0px 1px 2px 0px inset;
    text-overflow: ellipsis;

    &:disabled {
        background-color: rgb(248, 249, 250);
        border-color: rgb(160, 173, 186);
        color: rgb(110, 122, 138);
        cursor: not-allowed;
    }
`;
