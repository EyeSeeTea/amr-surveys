import { Button, Collapse, List, ListItem, makeStyles, Theme, colors } from "@material-ui/core";
import React from "react";
import clsx from "clsx";
import FolderIcon from "@material-ui/icons/Folder";
import { ExpandLess, ExpandMore } from "@material-ui/icons";
import i18n from "@eyeseetea/feedback-component/locales";
import LeftNavMenu from "./LeftNavMenu";
import styled from "styled-components";
import { MenuGroup, MenuLeaf } from "../../hooks/useMenu";

interface LeftNavMenuProps {
    className?: string;
    groupName: string;
    menu: MenuGroup;
}

const LeftNavMenuGroup: React.FC<LeftNavMenuProps> = ({ menu, groupName, className }) => {
    const classes = useStyles(0);

    // const isCurrent = (name: string) => {
    //     return currentModuleAccess.moduleName === name;
    // };
    const [expanded, setExpanded] = React.useState(true);

    // useEffect(() => {
    //     if (currentModuleAccess.moduleName === menu.title) {
    //         setExpanded(true);
    //     }
    // }, [menu.title, currentModuleAccess.moduleName]);

    const toggleExpanded = () => {
        setExpanded(!expanded);
    };

    return (
        <React.Fragment>
            <ListItem
                className={clsx(classes.root, className)}
                onClick={toggleExpanded}
                disableGutters
                data-current-group-name={menu.title}
            >
                <Button className={classes.button} fullWidth={true}>
                    <div className={classes.icon}>
                        <FolderIcon htmlColor={menu.moduleColor} />
                    </div>
                    {/* {`${moduleName} | ${currentNavItem.groupName} | ${groupName}`} */}
                    <span className={classes.title}>{i18n.t(menu.title)}</span>
                    <div className={classes.expand}>
                        {expanded ? <ExpandLess /> : <ExpandMore />}
                    </div>
                </Button>
            </ListItem>

            <ModuleWrap moduleColor={menu.moduleColor}>
                <Collapse in={expanded} timeout="auto" unmountOnExit key={menu.title}>
                    <List component="div" disablePadding data-group-name={groupName}>
                        {menu.children &&
                            menu.children.map(
                                (child: MenuLeaf) => (
                                    // child.kind === "MenuGroup" ? (
                                    //     <LeftNavMenuGroup
                                    //         menu={child}
                                    //         key={child.title}
                                    //         groupName={groupName}
                                    //     />
                                    // ) : (
                                    <LeftNavMenu
                                        menu={child}
                                        key={child.title}
                                        groupName={groupName}
                                    />
                                )
                                // )
                            )}
                    </List>
                </Collapse>
            </ModuleWrap>
        </React.Fragment>
    );
};

export default LeftNavMenuGroup;

const useStyles = makeStyles((theme: Theme) => ({
    root: { padding: theme.spacing(0) },
    button: {
        color: colors.blueGrey[800],
        padding: "10px 8px",
        justifyContent: "flex-start",
        textTransform: "none",
        letterSpacing: 0,
        width: "100%",
    },
    icon: {
        width: 24,
        height: 24,
        display: "flex",
        alignItems: "center",
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(1),
    },
    title: {
        textAlign: "start",
        flexGrow: 1,
        marginLeft: "10px",
    },
    expand: {
        marginRight: theme.spacing(4),
    },
}));

const ModuleWrap = styled.div<{ moduleColor: string }>`
    a[data-is-page-current="true"] {
        background: ${props => props.moduleColor};
        * {
            color: white !important;
        }
    }
`;
