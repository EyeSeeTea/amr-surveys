import { IconButton, Menu, MenuItem } from "@material-ui/core";
import MoreVert from "@material-ui/icons/MoreVert";
import * as React from "react";
import styled from "styled-components";
import { OptionType } from "../../../domain/utils/optionsHelper";
import _c from "../../../domain/entities/generic/Collection";
import { makeStyles } from "@material-ui/styles";
import { ArrowForwardIosOutlined } from "@material-ui/icons";

interface ActionMenuProps {
    options: OptionType[];
    optionClickHandler: { option: string; handler: (option?: string) => void }[];
    onClickHandler: () => void;
}

const useStyles = makeStyles({
    popOverRoot: {
        pointerEvents: "none",
    },
});

export const ActionMenuButton: React.FC<ActionMenuProps> = ({
    options,
    optionClickHandler,
    onClickHandler,
}) => {
    const [mainAnchorEl, setMainAnchorEl] = React.useState<null | HTMLElement>(null);
    const [subMenuAnchorEl, setSubMenuAnchorEl] =
        React.useState<{ option: string; element: HTMLElement | null }[]>();
    const styles = useStyles();

    React.useEffect(() => {
        const subMenus = _c(
            options.map(option => {
                if (option.isSubMenu) {
                    return { option: option.label, element: null };
                }
            })
        )
            .compact()
            .value();
        if (subMenus) setSubMenuAnchorEl(subMenus);
    }, [options, setSubMenuAnchorEl]);

    const handleMainClick = React.useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            setMainAnchorEl(event.currentTarget);
        },
        [setMainAnchorEl]
    );

    const handleMainClose = React.useCallback(() => {
        setMainAnchorEl(null);
    }, [setMainAnchorEl]);

    const handleSubMenuClick = React.useCallback(
        (event: React.MouseEvent<HTMLElement>, option: string) => {
            setSubMenuAnchorEl(prevSubMenu => {
                return prevSubMenu?.map(subMenu => {
                    if (subMenu.option === option) {
                        return { option: subMenu.option, element: event.currentTarget };
                    } else {
                        return { option: subMenu.option, element: null };
                    }
                });
            });
        },
        [setSubMenuAnchorEl]
    );

    const handleSubMenuClose = React.useCallback(
        (option: string) => {
            setSubMenuAnchorEl(prevSubMenu => {
                return prevSubMenu?.map(subMenu => {
                    if (subMenu.option === option) {
                        return { option: subMenu.option, element: null };
                    } else {
                        return { option: subMenu.option, element: null };
                    }
                });
            });
        },
        [setSubMenuAnchorEl]
    );

    const mainMenuItemClick = React.useCallback(
        (option: string) => {
            optionClickHandler.find(optionClick => optionClick.option === option)?.handler(option);
            handleMainClose();
            handleSubMenuClose(option);
        },
        [handleMainClose, handleSubMenuClose, optionClickHandler]
    );

    return (
        <div onClick={onClickHandler}>
            <StyledIconButton
                aria-label="more"
                id="long-button"
                aria-controls={mainAnchorEl ? "long-menu" : undefined}
                aria-expanded={mainAnchorEl ? "true" : undefined}
                aria-haspopup="true"
                onClick={handleMainClick}
            >
                <MoreVert />
            </StyledIconButton>
            <Menu
                id="long-menu"
                MenuListProps={{
                    "aria-labelledby": "long-button",
                }}
                anchorEl={mainAnchorEl}
                open={Boolean(mainAnchorEl)}
                onClose={handleMainClose}
            >
                {options
                    .filter(option => !option.isHidden)
                    .map((option, index) =>
                        option.isSubMenu === true ? (
                            <div key={index}>
                                <MenuItem onMouseOver={e => handleSubMenuClick(e, option.label)}>
                                    <span
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            width: "100%",
                                        }}
                                    >
                                        {option.label}
                                        <ArrowForwardIosOutlined fontSize="small" />
                                    </span>
                                </MenuItem>

                                <Menu
                                    id="long-menu"
                                    MenuListProps={{
                                        "aria-labelledby": "long-button",
                                        onMouseEnter: e => handleSubMenuClick(e, option.label),
                                        onMouseLeave: _e => handleSubMenuClose(option.label),
                                        style: { pointerEvents: "auto" },
                                    }}
                                    anchorEl={
                                        subMenuAnchorEl?.find(
                                            subMenu => subMenu.option === option.label
                                        )?.element
                                    }
                                    open={Boolean(
                                        subMenuAnchorEl?.find(
                                            subMenu => subMenu.option === option.label
                                        )?.element
                                    )}
                                    onClose={() => handleSubMenuClose(option.label)}
                                    getContentAnchorEl={null}
                                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                                    PopoverClasses={{
                                        root: styles.popOverRoot,
                                    }}
                                >
                                    {option.subMenu
                                        ?.filter(subMenu => !subMenu.isHidden)
                                        .map(subMenuOption => (
                                            <MenuItem
                                                key={subMenuOption.label}
                                                onClick={() =>
                                                    mainMenuItemClick(subMenuOption.label)
                                                }
                                            >
                                                {subMenuOption.label}
                                            </MenuItem>
                                        ))}
                                </Menu>
                            </div>
                        ) : (
                            <MenuItem
                                key={option.label}
                                onClick={() => mainMenuItemClick(option.label)}
                            >
                                {option.label}
                            </MenuItem>
                        )
                    )}
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
