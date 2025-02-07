import { useEffect, useState } from "react";
import {
    isPPSIndicationLinkQuestion,
    isPPSTreatmentLinkQuestion,
    Question,
    QuestionOption,
    SelectQuestion,
} from "../../../domain/entities/Questionnaire/QuestionnaireQuestion";
import { Maybe } from "../../../utils/ts-utils";

export const useTreatmentIndicationLinkDropdown = (
    question: Question,
    treatmentOptions?: Maybe<QuestionOption[]>,
    indicationOptions?: Maybe<QuestionOption[]>
) => {
    const [linkQuestion, setLinkQuestion] = useState<SelectQuestion>();

    useEffect(() => {
        if (isPPSTreatmentLinkQuestion(question)) {
            const treatmentDropdown: SelectQuestion = {
                ...question,
                type: "select",
                options: treatmentOptions || [],
                value: treatmentOptions?.find(op => op.id === question.value) || undefined,
            };
            setLinkQuestion(treatmentDropdown);
        } else if (isPPSIndicationLinkQuestion(question)) {
            const indicationDropdown: SelectQuestion = {
                ...question,
                type: "select",
                options: indicationOptions || [],
                value: indicationOptions?.find(op => op.id === question.value) || undefined,
                disabled: true,
            };
            setLinkQuestion(indicationDropdown);
        }
    }, [indicationOptions, question, setLinkQuestion, treatmentOptions]);

    return { linkQuestion };
};
