import styled from "styled-components";
import i18n from "../../../utils/i18n";

export const OfflineMessage: React.FC = () => {
    return (
        <CenteredText>
            {i18n.t(
                "You cannot carry out this action because you are not connected to the internet. Please try again later."
            )}
        </CenteredText>
    );
};

const CenteredText = styled.p`
    text-align: center;
`;
