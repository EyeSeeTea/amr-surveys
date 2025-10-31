import { Maybe } from "../../../utils/ts-utils";
import DropdownSelectWidget from "../survey-questions/widgets/DropdownSelectWidget";
import styled from "styled-components";
import Collapsible from "../collapsible/Collapsible";
import { WardSummarySection } from "./WardSummarySection";
import { useSelectablePeriods } from "./hooks/useSelectablePeriods";
import { useWardSummaryForm } from "./hooks/useWardSummaryForm";
import { ContentLoader } from "../content-loader/ContentLoader";
import { Id } from "../../../domain/entities/Ref";
import i18n from "../../../utils/i18n";
import { SurveyFormOUSelector } from "../survey/SurveyFormOUSelector";
import { useSurveyForm } from "../survey/hook/useSurveyForm";

type WardSummaryFormProps = {
    hasReadOnlyAccess: boolean;
};

export const WardSummaryForm: React.FC<WardSummaryFormProps> = props => {
    const { hasReadOnlyAccess } = props;

    const { currentOrgUnit, setCurrentOrgUnit } = useSurveyForm(
        "WardSummaryStatisticsForm",
        undefined
    );
    const {
        error,
        loading,
        selectedPeriod,
        wardSummaryForms,
        getCellBackgroundColor,
        saveWardSummaryForm,
        updateWardSummaryPeriod,
    } = useWardSummaryForm(currentOrgUnit?.orgUnitId);
    const selectablePeriods = useSelectablePeriods();

    return (
        <Container>
            <SurveyFormOUSelector
                formType={"WardSummaryStatisticsForm"}
                currentOrgUnit={currentOrgUnit}
                setCurrentOrgUnit={setCurrentOrgUnit}
                currentSurveyId={undefined}
            />

            <FormFilters>
                <DropdownSelectWidget
                    label="Period"
                    value={selectedPeriod}
                    options={selectablePeriods}
                    onChange={updateWardSummaryPeriod}
                    disabled={false}
                />
            </FormFilters>

            <ContentLoader loading={loading} error={error} showErrorAsSnackbar={true}>
                <NoFormsMessage
                    currentOrgUnitId={currentOrgUnit?.orgUnitId}
                    selectedPeriod={selectedPeriod}
                    wardSummaryFormsLength={wardSummaryForms.length}
                />

                {wardSummaryForms.map(wardSummarySection => (
                    <Collapsible key={wardSummarySection.formId} title={wardSummarySection.title}>
                        <WardSummarySection
                            getCellBackgroundColor={getCellBackgroundColor}
                            hasReadOnlyAccess={hasReadOnlyAccess}
                            wardSummarySection={wardSummarySection}
                            saveWardSummaryForm={saveWardSummaryForm}
                        />
                    </Collapsible>
                ))}
            </ContentLoader>
        </Container>
    );
};

const NoFormsMessage: React.FC<{
    currentOrgUnitId: Maybe<Id>;
    selectedPeriod: Maybe<string>;
    wardSummaryFormsLength: number;
}> = ({ currentOrgUnitId, selectedPeriod, wardSummaryFormsLength }) => {
    if (!selectedPeriod || !currentOrgUnitId)
        return (
            <p>
                {i18n.t(
                    "Please select a period and org unit to view ward summary statistics forms."
                )}
            </p>
        );
    else if (selectedPeriod && wardSummaryFormsLength === 0)
        return (
            <p>
                {i18n.t(
                    "No ward summary statistics forms found for the selected period and org unit."
                )}
            </p>
        );
    return null;
};

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2rem;
`;

const FormFilters = styled.div`
    display: flex;
    gap: 6rem;
    align-items: center;
    padding-block-start: 1rem;
`;
