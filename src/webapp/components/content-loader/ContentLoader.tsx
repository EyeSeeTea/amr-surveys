import { Backdrop, CircularProgress } from "@material-ui/core";
import React, { ReactNode, useEffect } from "react";
import styled from "styled-components";
import { useOfflineSnackbar } from "../../hooks/useOfflineSnackbar";

export interface ContentLoaderProps {
    loading: boolean;
    error: string | undefined;
    children: ReactNode;
    showErrorAsSnackbar: boolean;
    onError?: () => void;
}

export const ContentLoader: React.FC<ContentLoaderProps> = ({
    loading,
    error,
    children,
    showErrorAsSnackbar,
    onError,
}) => {
    const { offlineError } = useOfflineSnackbar();

    useEffect(() => {
        if (error && showErrorAsSnackbar) {
            offlineError(error);
        }

        if (error && onError) {
            onError();
        }
    }, [error, offlineError, showErrorAsSnackbar, onError]);

    if (loading) {
        return (
            <Backdrop open={true} style={{ color: "#fff", zIndex: 1 }}>
                <StyledLoaderContainer>
                    <CircularProgress color="inherit" size={50} />
                </StyledLoaderContainer>
            </Backdrop>
        );
    } else {
        return <>{children}</>;
    }
};

const StyledLoaderContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;
