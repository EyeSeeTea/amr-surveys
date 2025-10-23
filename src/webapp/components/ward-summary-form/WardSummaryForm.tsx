import { Maybe } from "../../../utils/ts-utils";
import DropdownSelectWidget from "../survey-questions/widgets/DropdownSelectWidget";
import i18n from "@eyeseetea/d2-ui-components/locales";
import styled from "styled-components";
import Collapsible from "../collapsible/Collapsible";
import { WardSummarySection } from "./WardSummarySection";
import { Button } from "@material-ui/core";
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
        getWardSummaryForm,
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

                <Button
                    variant="contained"
                    color="primary"
                    onClick={getWardSummaryForm}
                    disabled={!currentOrgUnitId || !selectedPeriod}
                >
                    {i18n.t("Load Ward Summary Form")}
                </Button>
            </FormFilters>

            <ContentLoader loading={loading} error={error} showErrorAsSnackbar={true}>
                {wardSummaryForms.map((wardSummarySection, index) => (
                    <Collapsible
                        key={wardSummarySection.title}
                        title={wardSummarySection.title}
                        defaultOpen={index === 0}
                    >
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
