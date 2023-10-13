import React from "react";
import styled from "styled-components";
import { UserSettingsContent } from "../../components/user-profile/UserSettingsContent";
import { useAppContext } from "../../contexts/app-context";

export const UserSettingsPage: React.FC = React.memo(() => {
    const { currentUser } = useAppContext();

    return (
        <ContentWrapper>
            <UserSettingsContent userInformation={currentUser} />
        </ContentWrapper>
    );
});

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;
