import { IconButton, Menu, MenuItem } from "@material-ui/core";
import MoreVert from "@material-ui/icons/MoreVert";
import * as React from "react";

interface ActionMenuProps {
    options: string[];
    optionClickHandler: { option: string; handler: () => void }[];
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
        optionClickHandler.find(optionClick => optionClick.option === option)?.handler();
        handleClose();
    };

    return (
        <div onClick={onClickHandler}>
            <IconButton
                aria-label="more"
                id="long-button"
                aria-controls={open ? "long-menu" : undefined}
                aria-expanded={open ? "true" : undefined}
                aria-haspopup="true"
                onClick={handleClick}
            >
                <MoreVert />
            </IconButton>
            <Menu
                id="long-menu"
                MenuListProps={{
                    "aria-labelledby": "long-button",
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                {options.map(option => (
                    <MenuItem key={option} onClick={() => menuItemClick(option)}>
                        {option}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
};
