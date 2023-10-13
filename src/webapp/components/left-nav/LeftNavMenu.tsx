import i18n from "@eyeseetea/feedback-component/locales";
import { Button, colors, ListItem, makeStyles, Theme, Typography } from "@material-ui/core";

import { NavLink } from "react-router-dom";
import { MenuLeaf } from "../../hooks/useMenu";
import { palette } from "../../pages/app/themes/dhis2.theme";

interface LeftNavMenuProps {
    className?: string;
    groupName?: string;
    menu: MenuLeaf;
}

const LeftNavMenu: React.FC<LeftNavMenuProps> = ({ menu }) => {
    const classes = useStyles(0);

    return (
        <ListItem disableGutters >
            <Button
                className={classes.button}
                component={NavLink}
                to={menu.path}
                exact={true}
                // onClick={() => updateModuleAndPeriodContext(groupName || "")}
            >
                <div className={classes.icon}>{menu.icon}</div>
                <Typography variant="body1" style={{ color: palette.text.primary }}>
                    {i18n.t(menu.title)}
                </Typography>
            </Button>
        </ListItem>
    );
};

export default LeftNavMenu;

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        padding: theme.spacing(0),
    },
    button: {
        color: colors.pink[800],
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
        marginRight: theme.spacing(1),
    },
    active: {
        color: theme.palette.primary.main,
        "& $icon": {
            color: theme.palette.primary.main,
        },
    },
}));
