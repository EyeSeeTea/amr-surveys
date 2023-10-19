import { Maybe } from "../../../../utils/ts-utils";

export interface BaseWidgetProps<T> {
    onChange(value: Maybe<T>): void;
    disabled: boolean;
}
