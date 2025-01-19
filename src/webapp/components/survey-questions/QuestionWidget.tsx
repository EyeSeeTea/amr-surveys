import React, { useEffect, useState } from "react";
import BooleanWidget from "./widgets/BooleanWidget";
import NumberWidget from "./widgets/NumberWidget";
import SingleSelect from "./widgets/SingleSelectWidget";
import TextWidget from "./widgets/TextWidget";
import YesNoWidget from "./widgets/YesNoWidget";
import DatePickerWidget from "./widgets/DatePickerWidget";
import { Maybe, assertUnreachable } from "../../../utils/ts-utils";
import DateTimePickerWidget from "./widgets/DateTimePickerWidget";
import SearchableSelect from "./widgets/SearchableSelect";
import {
    Question,
    QuestionOption,
    QuestionnaireQuestion,
    SelectQuestion,
    isPPSIndicationLinkQuestion,
    isPPSTreatmentLinkQuestion,
} from "../../../domain/entities/Questionnaire/QuestionnaireQuestion";

export interface QuestionWidgetProps {
    onChange: (question: Question) => void;
    question: Question;
    disabled: boolean;
    treatmentOptions?: Maybe<QuestionOption[]>;
    indicationOptions?: Maybe<QuestionOption[]>;
}

export const QuestionWidget: React.FC<QuestionWidgetProps> = React.memo(props => {
    const { question, disabled, onChange, treatmentOptions, indicationOptions } = props;
    const { type } = question;
    const { update } = QuestionnaireQuestion;

    const [processedQuestion, setProcessedQuestion] = useState<SelectQuestion>();

    useEffect(() => {
        if (isPPSTreatmentLinkQuestion(question)) {
            const treatmentDropdown: SelectQuestion = {
                ...question,
                type: "select",
                options: treatmentOptions || [],
                value: treatmentOptions?.find(op => op.id === question.value) || undefined,
            };
            setProcessedQuestion(treatmentDropdown);
        } else if (isPPSIndicationLinkQuestion(question)) {
            const indicationDropdown: SelectQuestion = {
                ...question,
                type: "select",
                options: indicationOptions || [],
                value: indicationOptions?.find(op => op.id === question.value) || undefined,
                disabled: true,
            };
            setProcessedQuestion(indicationDropdown);
        }
    }, [indicationOptions, question, setProcessedQuestion, treatmentOptions]);

    switch (type) {
        case "select": {
            if (question.options.length > 5) {
                return (
                    <SearchableSelect
                        value={question.options.find(op => op.id === question.value?.id) || null}
                        options={question.options}
                        onChange={(value: Maybe<QuestionOption>) =>
                            onChange(update(question, value))
                        }
                        disabled={disabled}
                    />
                );
            } else {
                return (
                    <SingleSelect
                        value={question.value?.id}
                        options={question.options}
                        onChange={value => onChange(update(question, value))}
                        disabled={disabled}
                    />
                );
            }
        }

        case "boolean": {
            const BooleanComponent = question.storeFalse ? YesNoWidget : BooleanWidget;
            return (
                <BooleanComponent
                    value={question.value}
                    onChange={value => onChange(update(question, value))}
                    disabled={disabled}
                />
            );
        }
        case "number":
            return (
                <NumberWidget
                    value={question.value}
                    onChange={value => onChange(update(question, value))}
                    disabled={disabled}
                    numberType={question.numberType}
                />
            );
        case "text":
            if (isPPSTreatmentLinkQuestion(question) && processedQuestion) {
                return (
                    <SearchableSelect
                        value={
                            processedQuestion.options.find(
                                op => op.id === processedQuestion.value?.id
                            ) || null
                        }
                        options={processedQuestion.options}
                        onChange={(value: Maybe<QuestionOption>) =>
                            onChange(update(question, value?.id))
                        }
                        disabled={disabled}
                    />
                );
            } else if (isPPSIndicationLinkQuestion(question) && processedQuestion) {
                return (
                    <SearchableSelect
                        value={
                            processedQuestion.options.find(
                                op => op.id === processedQuestion.value?.id
                            ) || null
                        }
                        options={processedQuestion.options}
                        onChange={(value: Maybe<QuestionOption>) =>
                            onChange(update(question, value?.id))
                        }
                        disabled={disabled}
                    />
                );
            } else
                return (
                    <TextWidget
                        value={question.value}
                        onChange={value => onChange(update(question, value))}
                        disabled={disabled}
                        multiline={question.multiline}
                    />
                );

        case "date":
            return (
                <DatePickerWidget
                    name={question.id}
                    value={question.value}
                    onChange={value => onChange(update(question, value))}
                    disabled={disabled}
                />
            );
        case "datetime":
            return (
                <DateTimePickerWidget
                    name={question.id}
                    value={question.value}
                    onChange={value => onChange(update(question, value))}
                    disabled={disabled}
                />
            );
        default:
            assertUnreachable(type);
            return <></>;
    }
});
