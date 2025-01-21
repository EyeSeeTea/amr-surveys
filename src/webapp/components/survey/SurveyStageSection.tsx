import i18n from "@eyeseetea/d2-ui-components/locales";
import { QuestionnaireStage } from "../../../domain/entities/Questionnaire/Questionnaire";
import { Question } from "../../../domain/entities/Questionnaire/QuestionnaireQuestion";
import { QuestionnaireSection } from "../../../domain/entities/Questionnaire/QuestionnaireSection";
import { Id } from "../../../domain/entities/Ref";
import { GridSection } from "./GridSection";
import { CancelButton } from "./SurveyForm";
import { SurveySection } from "./SurveySection";
import { TableSection } from "./TableSection";
import styled from "styled-components";

type SurveyStageSectionProps = {
    section: QuestionnaireSection;
    stage: QuestionnaireStage;
    viewOnly: boolean;
    removeProgramStage: (stageId: Id) => void;
    updateQuestion: (question: Question, stageId?: Id) => void;
};

export const SurveyStageSection: React.FC<SurveyStageSectionProps> = props => {
    const { section, stage, viewOnly, removeProgramStage, updateQuestion } = props;

    switch (true) {
        case !section.isVisible:
        case section.isAntibioticSection:
            return null;
        case section.isSpeciesSection:
            return (
                <GridSection
                    speciesSection={section}
                    antibioticStage={stage}
                    updateQuestion={question => updateQuestion(question, stage.id)}
                    viewOnly={viewOnly}
                />
            );
        case section.isAntibioticTreatmentHospitalEpisodeSection:
            return (
                <TableSection
                    section={section}
                    updateQuestion={question => updateQuestion(question, stage.id)}
                    viewOnly={viewOnly}
                />
            );
        default:
            return (
                <>
                    <SurveySection
                        title={section.title}
                        updateQuestion={question => updateQuestion(question, stage.id)}
                        questions={section.questions}
                        viewOnly={viewOnly}
                    />

                    {stage.repeatable && stage.isAddedByUser && (
                        <PaddedDiv>
                            <CancelButton
                                variant="outlined"
                                onClick={() => removeProgramStage(stage.id)}
                            >
                                {i18n.t(`Remove ${stage.title}`)}
                            </CancelButton>
                        </PaddedDiv>
                    )}
                </>
            );
    }
};

const PaddedDiv = styled.div`
    padding: 15px 0;
`;
