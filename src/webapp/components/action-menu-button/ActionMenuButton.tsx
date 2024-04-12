import { IconButton, Menu, MenuItem } from "@material-ui/core";
import MoreVert from "@material-ui/icons/MoreVert";
import * as React from "react";
import styled from "styled-components";
import { OptionType } from "../../../domain/utils/optionsHelper";

interface ActionMenuProps {
    options: OptionType[];
    optionClickHandler: { option: string; handler: (option?: string) => void }[];
    onClickHandler: () => void;
}

export const ActionMenuButton: React.FC<ActionMenuProps> = ({
    options,
    optionClickHandler,
    onClickHandler,
}) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const menuItemClick = (option: string) => {
        optionClickHandler.find(optionClick => optionClick.option === option)?.handler(option);
        handleClose();
    };

    return (
        <div onClick={onClickHandler}>
            <StyledIconButton
                aria-label="more"
                id="long-button"
                aria-controls={open ? "long-menu" : undefined}
                aria-expanded={open ? "true" : undefined}
                aria-haspopup="true"
                onClick={handleClick}
            >
                <MoreVert />
            </StyledIconButton>
            <Menu
                id="long-menu"
                MenuListProps={{
                    "aria-labelledby": "long-button",
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                {options
                    .filter(option => !option.isHidden)
                    .map(option => (
                        <MenuItem key={option.label} onClick={() => menuItemClick(option.label)}>
                            {option.label}
                        </MenuItem>
                    ))}
            </Menu>
        </div>
    );
};

const StyledIconButton = styled(IconButton)`
    :hover {
        transition: background-color ease-in-out 300ms;
        background-color: white;
    }
`;
