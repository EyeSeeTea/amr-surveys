import { Maybe } from "../../../utils/ts-utils";
import DropdownSelectWidget from "../survey-questions/widgets/DropdownSelectWidget";
import styled from "styled-components";
import Collapsible from "../collapsible/Collapsible";
import { WardSummarySection } from "./WardSummarySection";
import { useSelectablePeriods } from "./hooks/useSelectablePeriods";
import { useWardSummaryForm } from "./hooks/useWardSummaryForm";
import { ContentLoader } from "../content-loader/ContentLoader";
import { Id } from "../../../domain/entities/Ref";

type WardSummaryFormProps = {
    currentOrgUnitId: Maybe<Id>;
    hasReadOnlyAccess: boolean;
};

export const WardSummaryForm: React.FC<WardSummaryFormProps> = props => {
    const { currentOrgUnitId, hasReadOnlyAccess } = props;

    const {
        error,
        loading,
        selectedPeriod,
        wardSummaryForms,
        getCellBackgroundColor,
        saveWardSummaryForm,
        updateWardSummaryPeriod,
    } = useWardSummaryForm(currentOrgUnitId);
    const selectablePeriods = useSelectablePeriods();

    return (
        <Container>
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
                {wardSummaryForms.map(wardSummarySection => (
                    <Collapsible key={wardSummarySection.title} title={wardSummarySection.title}>
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
