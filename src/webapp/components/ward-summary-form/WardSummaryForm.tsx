import { Maybe } from "../../../utils/ts-utils";
import DropdownSelectWidget from "../survey-questions/widgets/DropdownSelectWidget";
import { OrgUnitAccess } from "../../../domain/entities/User";
import i18n from "@eyeseetea/d2-ui-components/locales";
import { Id, NamedRef } from "../../../domain/entities/Ref";
import { WardForm } from "../../../domain/entities/Questionnaire/WardForm";
import styled from "styled-components";
import { useMemo } from "react";
import Collapsible from "../collapsible/Collapsible";
import { WardSummarySection } from "./WardSummarySection";
import { Button } from "@material-ui/core";

type WardSummaryFormProps = {
    currentOrgUnit: Maybe<OrgUnitAccess>;
    currentSurveyId: Maybe<Id>;
    hasReadOnlyAccess: boolean;
    selectedPeriod: Maybe<string>;
    wardSummaryForm: WardForm[];
    getWardSummaryForm: () => void;
    updateWardSummaryPeriod: (periodItem: Maybe<NamedRef>) => void;
};

export const WardSummaryForm: React.FC<WardSummaryFormProps> = props => {
    const {
        currentOrgUnit,
        hasReadOnlyAccess,
        selectedPeriod,
        wardSummaryForm,
        getWardSummaryForm,
        updateWardSummaryPeriod,
    } = props;

    const selectablePeriods = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 6 }, (_, i) => ({
            id: (currentYear - i).toString(),
            name: (currentYear - i).toString(),
        }));
    }, []);

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
                    disabled={!currentOrgUnit || !selectedPeriod}
                >
                    {i18n.t("Load Ward Summary Form")}
                </Button>
            </FormFilters>

            {wardSummaryForm.map((wardSummarySection, index) => (
                <Collapsible
                    key={wardSummarySection.title}
                    title={wardSummarySection.title}
                    defaultOpen={index === 0}
                >
                    <WardSummarySection
                        hasReadOnlyAccess={hasReadOnlyAccess}
                        wardSummarySection={wardSummarySection}
                    />
                </Collapsible>
            ))}
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
