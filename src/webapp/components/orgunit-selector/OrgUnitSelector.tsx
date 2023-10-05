import i18n from "@eyeseetea/feedback-component/locales";
import { Select } from "@material-ui/core";
import { MenuItem } from "material-ui";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useAppContext } from "../../contexts/app-context";
import SearchInput from "./SearchInput";

interface OrgUnitProps {
    fullWidth?: boolean;
}

export const OrgUnitSelector: React.FC<OrgUnitProps> = React.memo(() => {
    const {
        currentUser: { userOrgUnitsAccess },
    } = useAppContext();
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [orgUnitName, setOrgUnitName] = React.useState<string>(
        userOrgUnitsAccess[0]?.orgUnitName ?? ""
    );
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOrgUnits, setFilteredOrgUnits] = useState(userOrgUnitsAccess);

    useEffect(() => {
        if (searchTerm) {
            setFilteredOrgUnits(
                userOrgUnitsAccess.filter(orgUnit =>
                    orgUnit.orgUnitShortName.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        } else {
            setFilteredOrgUnits(userOrgUnitsAccess);
        }
    }, [searchTerm, userOrgUnitsAccess]);

    const changeOrgUnit = (e: React.ChangeEvent<{ name?: string | undefined; value: unknown }>) => {
        if (e.target?.value) setOrgUnitName(e.target?.value as string);
        // const orgUnitId = (e.currentTarget as HTMLInputElement).getAttribute("data-key");
        // if (orgUnitId) changeCurrentOrgUnitAccess(orgUnitId);
    };

    const handleClose = () => {
        setIsOpen(false);
        setSearchTerm("");
        setFilteredOrgUnits(userOrgUnitsAccess);
    };

    const handleOpen = () => {
        setIsOpen(true);
    };

    return (
        <StyledSelect
            value={orgUnitName}
            onChange={changeOrgUnit}
            disableUnderline
            MenuProps={{
                autoFocus: false,
                MenuListProps: { disablePadding: true },
                disableScrollLock: true,
            }}
            open={isOpen}
            onOpen={handleOpen}
            onClose={handleClose}
        >
            <SearchInputContainer>
                <StyledSearchInput
                    value={searchTerm}
                    onChange={term => setSearchTerm(term)}
                    autoFocus
                />
            </SearchInputContainer>
            <br />
            {filteredOrgUnits.length > 0 ? (
                filteredOrgUnits.map((orgUnit, i) => (
                    <StyledMenuItem
                        key={i}
                        data-key={orgUnit.orgUnitId}
                        value={orgUnit.orgUnitName}
                        index={i}
                    >
                        {i18n.t(orgUnit.orgUnitShortName)}
                    </StyledMenuItem>
                ))
            ) : (
                <StyledMenuItem index={0} disabled>
                    {i18n.t("No Organisation Units found")}
                </StyledMenuItem>
            )}
        </StyledSelect>
    );
});

const SearchInputContainer = styled.div`
    position: fixed;
    z-index: 200;
    width: 322px;
    height: 70px;
    background-color: white;
`;

const StyledSearchInput = styled(SearchInput)`
    height: 20px;
    border: 1px solid #cfe9f7;
    border-radius: 20px;
    width: 250px;
    position: fixed;
    margin: 10px 10px 0px 10px;
    z-index: 10;
`;

const StyledMenuItem = styled(MenuItem)<{ index: number }>`
    margin-top: ${props => (props.index === 0 ? "60px" : "initial")};
    width: 300px;
`;

const StyledSelect = styled(Select)`
    max-height: 400px;
    background-color: white;
`;
