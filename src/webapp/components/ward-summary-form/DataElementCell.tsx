import styled from "styled-components";
import { Maybe } from "../../../utils/ts-utils";

type DataElementItemProps = {
    backgroundColor?: string;
    dataValue: Maybe<string>;
    disabled?: boolean;
    onChange: (value: Maybe<string>) => void;
};

export const DataElementCell: React.FC<DataElementItemProps> = props => {
    const { backgroundColor, dataValue, disabled, onChange: notifyChange } = props;

    return (
        <CustomInput
            type="number"
            onBlur={e => notifyChange(e.target.value)}
            defaultValue={dataValue}
            disabled={disabled}
            style={{ backgroundColor: backgroundColor ?? "transparent" }}
        />
    );
};

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
