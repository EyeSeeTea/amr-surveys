import * as React from "react";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import styled from "styled-components";
import { PREVALENCE_PATIENT_OPTIONS } from "../../../domain/utils/PPSProgramsHelper";

interface SplitButtonProps {
    options: readonly string[];
    handleSplitButtonClick: (
        option:
            | (typeof PREVALENCE_PATIENT_OPTIONS)[0]
            | (typeof PREVALENCE_PATIENT_OPTIONS)[1]
            | (typeof PREVALENCE_PATIENT_OPTIONS)[2]
            | (typeof PREVALENCE_PATIENT_OPTIONS)[3]
            | (typeof PREVALENCE_PATIENT_OPTIONS)[4]
    ) => void;
}

export const SplitButton: React.FC<SplitButtonProps> = ({ options, handleSplitButtonClick }) => {
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);

    const handleMenuItemClick = (
        event: React.MouseEvent<HTMLLIElement, MouseEvent>,
        index: number
    ) => {
        setOpen(false);
        const selectedOption = options[index] as
            | (typeof PREVALENCE_PATIENT_OPTIONS)[0]
            | (typeof PREVALENCE_PATIENT_OPTIONS)[1]
            | (typeof PREVALENCE_PATIENT_OPTIONS)[2]
            | (typeof PREVALENCE_PATIENT_OPTIONS)[3]
            | (typeof PREVALENCE_PATIENT_OPTIONS)[4];
        if (selectedOption) handleSplitButtonClick(selectedOption);
    };

    const handleToggle = () => {
        setOpen(prevOpen => !prevOpen);
    };

    const handleClose = (event: Event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
            return;
        }
        setOpen(false);
    };

    return (
        <>
            <ButtonGroup variant="contained" ref={anchorRef} aria-label="split button">
                <StyledCreateNewButton>Create New</StyledCreateNewButton>
                <Button
                    size="small"
                    aria-controls={open ? "split-button-menu" : undefined}
                    aria-expanded={open ? "true" : undefined}
                    aria-haspopup="menu"
                    onClick={handleToggle}
                >
                    <ArrowDropDownIcon />
                </Button>
            </ButtonGroup>
            <Popper
                sx={{
                    zIndex: 1,
                }}
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
            >
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === "bottom" ? "center top" : "center bottom",
                        }}
                    >
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList id="split-button-menu" autoFocusItem>
                                    {options.map((option, index) => (
                                        <StyledMenu key={option}>
                                            <MenuItem
                                                key={option}
                                                onClick={event => handleMenuItemClick(event, index)}
                                            >
                                                {option}
                                            </MenuItem>
                                        </StyledMenu>
                                    ))}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </>
    );
};

const StyledMenu = styled.div`
    padding: 5px;
`;

const StyledCreateNewButton = styled(Button)`
    .MuiButtonGroup-firstButton {
        cursor: auto;
    }
`;
