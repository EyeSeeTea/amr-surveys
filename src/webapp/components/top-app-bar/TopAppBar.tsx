import {
    AppBar,
    Box,
    IconButton,
    ListItemIcon,
    ListItemText,
    makeStyles,
    Menu,
} from "@material-ui/core";
import { Avatar, MenuItem, Toolbar } from "material-ui";
import React from "react";
import { useHistory } from "react-router-dom";
import { useAppContext } from "../../contexts/app-context";
import MenuIcon from "@material-ui/icons/Menu";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import PersonOutlineIcon from "@material-ui/icons/PersonOutline";
import i18n from "@eyeseetea/feedback-component/locales";
import SettingsIcon from "@material-ui/icons/Settings";
import styled from "styled-components";
import { palette } from "../../pages/app/themes/dhis2.theme";
import useOnlineStatus from "../../hooks/useOnlineStatus";

const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    toolbar: {
        background: "#FFFFFF!important",
        minHeight: 70,
        alignItems: "center",
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
    },
    title: {
        flexGrow: 1,
        alignSelf: "flex-end",
    },
    isDark: {
        background: "black",
    },
}));

interface TopAppBarProps {
    toggleShowMenu: () => void;
}
export const TopAppBar: React.FC<TopAppBarProps> = ({ toggleShowMenu }) => {
    const classes = useStyles();
    const history = useHistory();
    const isOnline = useOnlineStatus();

    const { currentUser } = useAppContext();

    const [anchorEl, setAnchorEl] = React.useState(null);

    const nameInitials = (name: string): string => {
        const nameArray = name.split(" ");
        if (nameArray.length > 2) {
            return `${nameArray[0]?.charAt(0)}${nameArray[nameArray.length - 1]?.charAt(0)}`;
        } else {
            return nameArray.map(name => name.charAt(0)).join("");
        }
    };

    const handleClick = (event: React.BaseSyntheticEvent) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (url?: string) => {
        setAnchorEl(null);
        if (url) {
            history.push(url);
        }
    };

    return (
        <div className={classes.root}>
            <AppBar position="static">
                <Toolbar className={classes.toolbar}>
                    <IconButton
                        edge="start"
                        className={classes.menuButton}
                        color="primary"
                        aria-label="open drawer"
                        onClick={toggleShowMenu}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box className={classes.title} />

                    <OnlineStatusContainer>
                        <StatusIndicator isOnline={isOnline}>&#9679;</StatusIndicator>
                        <p>{isOnline ? i18n.t("Online") : i18n.t("Offline")}</p>
                    </OnlineStatusContainer>

                    <SelectContainer>
                        <AvatarContainer id="demo-positioned-button" onClick={handleClick}>
                            <Avatar style={{ backgroundColor: "#0099DE" }}>
                                {nameInitials(currentUser.name)}
                            </Avatar>
                            {anchorEl ? (
                                <KeyboardArrowUpIcon color="primary" />
                            ) : (
                                <KeyboardArrowDownIcon color="primary" />
                            )}
                        </AvatarContainer>
                        <Menu
                            id="simple-menu"
                            aria-labelledby="demo-positioned-button"
                            anchorEl={anchorEl}
                            keepMounted
                            open={Boolean(anchorEl)}
                            onClose={() => handleClose()}
                            disableScrollLock={true}
                        >
                            <MenuItem onClick={() => handleClose("/user-profile")}>
                                <ListItemIcon>
                                    <PersonOutlineIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={i18n.t("Profile")} />
                            </MenuItem>
                            <MenuItem onClick={() => handleClose("/user-settings")}>
                                <ListItemIcon>
                                    <SettingsIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={i18n.t("Settings")} />
                            </MenuItem>
                        </Menu>
                    </SelectContainer>
                </Toolbar>
            </AppBar>
        </div>
    );
};

const SelectContainer = styled.div`
    margin: 16px 16px;
`;

const AvatarContainer = styled.div`
    display: flex;
    align-items: center;
    :hover {
        cursor: pointer;
    }
`;

const OnlineStatusContainer = styled.div`
    margin: 16px 16px;
    display: flex;
    align-items: center;
    background-color: #0099de;
    padding: 0 16px;
    font-size: 14px;
    border-radius: 5px;
    gap: 8px;
`;

const StatusIndicator = styled.p<{
    isOnline: boolean;
}>`
    color: ${props => (props.isOnline ? palette.status.positive : palette.status.negative)};
`;
