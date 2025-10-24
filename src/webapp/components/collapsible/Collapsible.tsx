import React from "react";
import {
    Box,
    Card,
    Collapse,
    Divider,
    IconButton,
    Typography,
    makeStyles,
} from "@material-ui/core";
import { ExpandMore as ExpandMoreIcon } from "@material-ui/icons";

type CollapsibleProps = {
    title: React.ReactNode;
    defaultOpen?: boolean;
    children: React.ReactNode;
    actions?: React.ReactNode;
};

export default function Collapsible({
    title,
    defaultOpen = true,
    children,
    actions,
}: CollapsibleProps) {
    const classes = useStyles();
    const [open, setOpen] = React.useState(defaultOpen);

    return (
        <Card elevation={1}>
            <div className={classes.header}>
                <Box display={"flex"} alignItems="center">
                    <IconButton
                        onClick={() => setOpen(o => !o)}
                        className={open ? classes.rotateDown : classes.rotateRight}
                    >
                        <ExpandMoreIcon />
                    </IconButton>
                    <Typography variant="h5">{title}</Typography>
                </Box>

                <Box display="flex" alignItems="center">
                    {actions}
                </Box>
            </div>
            <Divider />
            <Collapse in={open} timeout="auto" unmountOnExit>
                {children}
            </Collapse>
        </Card>
    );
}

const useStyles = makeStyles(theme => ({
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: theme.spacing(1.5, 2),
    },
    rotateRight: {
        transform: "rotate(270deg)",
        transition: "transform 200ms ease",
    },
    rotateDown: {
        transform: "rotate(0deg)",
        transition: "transform 200ms ease",
    },
}));
