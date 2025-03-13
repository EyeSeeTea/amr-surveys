import i18n from "@eyeseetea/feedback-component/locales";
import { FormControl, InputLabel, MenuItem, Select } from "@material-ui/core";
import { Dispatch, SetStateAction } from "react";
import styled from "styled-components";
import { SURVEY_STATUSES, SURVEY_TYPES } from "../../../domain/entities/Survey";

interface SurveyListFilterProps {
    status: SURVEY_STATUSES | undefined;
    setStatus: Dispatch<SetStateAction<SURVEY_STATUSES | undefined>>;
    surveyType?: SURVEY_TYPES | undefined;
    handleSurveyTypeFilter?: (surveyType: SURVEY_TYPES | undefined) => void;
}
export const SurveyListFilters: React.FC<SurveyListFilterProps> = ({
    status,
    setStatus,
    surveyType,
    handleSurveyTypeFilter,
}) => {
    return (
        <FilterContainer>
            <FormControl style={{ width: "50%" }}>
                <InputLabel id="status-label">{i18n.t("Filter by Status")}</InputLabel>
                <Select
                    labelId="status-label"
                    value={status}
                    onChange={e => {
                        if (e.target.value === "ALL") setStatus(undefined);
                        else setStatus(e.target.value as SURVEY_STATUSES);
                    }}
                    label="STATUS"
                >
                    <MenuItem key="COMPLETED" value="COMPLETED">
                        {i18n.t("COMPLETED")}
                    </MenuItem>
                    <MenuItem key="ACTIVE" value="ACTIVE">
                        {i18n.t("ACTIVE")}
                    </MenuItem>
                    <MenuItem key="FUTURE" value="FUTURE">
                        {i18n.t("FUTURE")}
                    </MenuItem>
                    <MenuItem key="ALL-Status" value="ALL">
                        {i18n.t("ALL")}
                    </MenuItem>
                </Select>
            </FormControl>

            {handleSurveyTypeFilter && (
                <FormControl style={{ width: "50%" }}>
                    <InputLabel id="status-label">{i18n.t("Filter by Survey Type")}</InputLabel>
                    <Select
                        value={surveyType}
                        onChange={e => {
                            if (e.target.value === "ALL") handleSurveyTypeFilter(undefined);
                            else handleSurveyTypeFilter(e.target.value as SURVEY_TYPES);
                        }}
                    >
                        <MenuItem key="SUPRANATIONAL" value="SUPRANATIONAL">
                            {i18n.t("SUPRANATIONAL")}
                        </MenuItem>
                        <MenuItem key="NATIONAL" value="NATIONAL">
                            {i18n.t("NATIONAL")}
                        </MenuItem>
                        <MenuItem key="HOSP" value="HOSP">
                            {i18n.t("HOSP")}
                        </MenuItem>
                        <MenuItem key="ALL-SurveyType" value="ALL">
                            {i18n.t("ALL")}
                        </MenuItem>
                    </Select>
                </FormControl>
            )}
        </FilterContainer>
    );
};

const FilterContainer = styled.div`
    padding: 10px;
    display: flex;
    gap: 25px;
`;
