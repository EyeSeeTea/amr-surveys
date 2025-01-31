import i18n from "@eyeseetea/feedback-component/locales";
import { Typography } from "@material-ui/core";
import { palette } from "../../pages/app/themes/dhis2.theme";
import styled from "styled-components";

export const AppFooter: React.FC = () => {
    return (
        <Wrapper>
            <Typography variant="body2" gutterBottom>
                <Link
                    href="https://www.who.int/about/policies/privacy"
                    target="_blank"
                    style={{ marginRight: 20 }}
                >
                    {i18n.t("WHO privacy policy")}
                </Link>{" "}
                <Link
                    href="https://www.who.int/about/policies/publishing/copyright"
                    target="_blank"
                >
                    {i18n.t(`©WHO ${new Date().getFullYear()}`)}
                </Link>
            </Typography>
        </Wrapper>
    );
};

const Link = styled.a`
    color: ${palette.text.secondary};
    text-decoration: none;
    &:hover {
        color: ${palette.text.primary};
    }
`;

const Wrapper = styled.div`
    background-color: transparent;
    text-align: center;
    margin: 20px auto 0 auto;
    padding: 10px;
    height: 25px;
`;
