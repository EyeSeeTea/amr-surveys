import i18n from "@eyeseetea/feedback-component/locales";
import { FormControl, InputLabel, MenuItem, Select } from "@material-ui/core";
import { Dispatch, SetStateAction } from "react";
import styled from "styled-components";
import { SURVEY_STATUSES, SURVEY_TYPES } from "../../../domain/entities/Survey";

interface SurveyListFilterProps {
    status: SURVEY_STATUSES | undefined;
    setStatus: Dispatch<SetStateAction<SURVEY_STATUSES | undefined>>;
    surveyType: SURVEY_TYPES | undefined;
    setSurveyType: Dispatch<SetStateAction<SURVEY_TYPES | undefined>>;
}
export const SurveyListFilters: React.FC<SurveyListFilterProps> = ({
    status,
    setStatus,
    surveyType,
    setSurveyType,
}) => {
    return (
        <FilterContainer>
            <FormControl fullWidth>
                <InputLabel id="status-label">Filter by Status</InputLabel>
                <Select
                    MenuProps={{
                        anchorOrigin: { vertical: "bottom", horizontal: "left" },
                        transformOrigin: {
                            vertical: "top",
                            horizontal: "left",
                        },
                    }}
                    labelId="status-label"
                    value={status}
                    onChange={e => {
                        if (e.target.value === "NONE") setStatus(undefined);
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
                    <MenuItem key="NONE-Status" value="NONE">
                        {i18n.t("NONE")}
                    </MenuItem>
                </Select>
            </FormControl>

            <FormControl fullWidth>
                <InputLabel id="status-label">Filter by Survey Type</InputLabel>
                <Select
                    value={surveyType}
                    onChange={e => {
                        if (e.target.value === "NONE") setSurveyType(undefined);
                        else setSurveyType(e.target.value as SURVEY_TYPES);
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
                    <MenuItem key="NONE-SurveyType" value="NONE">
                        {i18n.t("NONE")}
                    </MenuItem>
                </Select>
            </FormControl>
        </FilterContainer>
    );
};

const FilterContainer = styled.div`
    padding: 10px;
    display: flex;
    gap: 25px;
`;
