import { useEffect, useState } from "react";
import { Question } from "../../../../domain/entities/Questionnaire/QuestionnaireQuestion";
import {
    AMR_SURVEYS_MORTALITY_DET_SPECIFY_INN,
    QuestionnaireSection,
} from "../../../../domain/entities/Questionnaire/QuestionnaireSection";
import _c from "../../../../domain/entities/generic/Collection";

type QuestionGroup = {
    groupId: string;
    columnQuestions: Question[];
    detailQuestion?: Question;
}[];

export const useTableSection = (section: QuestionnaireSection) => {
    const [questionGroups, setQuestionGroups] = useState<QuestionGroup>();
    const [headerRow, setHeaderRow] = useState<string[]>();

    useEffect(() => {
        const groupedRows: QuestionGroup = _c(section.questions)
            .groupBy(q => {
                return q.text.charAt(0); //Group by section Id which is the first character of the question text
            })
            .mapValues(([groupId, questions]) => {
                return {
                    groupId: groupId,
                    columnQuestions: questions.filter(
                        question => !question.code.startsWith(AMR_SURVEYS_MORTALITY_DET_SPECIFY_INN)
                    ), // all questions other than the detail question
                    detailQuestion: questions.find(question =>
                        question.code.startsWith(AMR_SURVEYS_MORTALITY_DET_SPECIFY_INN)
                    ),
                };
            })
            .values();

        const headers =
            groupedRows[0]?.columnQuestions
                ?.filter(q => q.isVisible)
                .map(q => q.text.replace("1", "").replace(".", "")) ?? [];
        setHeaderRow(headers);
        setQuestionGroups(groupedRows);
    }, [setQuestionGroups, setHeaderRow, section]);

    return { questionGroups, headerRow };
};
