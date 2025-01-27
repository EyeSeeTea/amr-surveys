import i18n from "@eyeseetea/feedback-component/locales";
import { Select } from "@material-ui/core";
import { MenuItem } from "material-ui";
import { ChangeEvent, FC, useEffect } from "react";
import styled from "styled-components";
import { UserAttrs } from "../../../domain/entities/User";
import { CustomCard } from "../custom-card/CustomCard";
import { useUserSettings } from "./hooks/useUserSettings";
import { useOfflineSnackbar } from "../../hooks/useOfflineSnackbar";

interface UserSettingsContentProps {
    userInformation: UserAttrs;
}

const booleanOptions: { label: string; value: string }[] = [
    { label: "YES", value: "true" },
    { label: "NO", value: "false" },
];

export const UserSettingsContent: FC<UserSettingsContentProps> = ({ userInformation }) => {
    const snackbar = useOfflineSnackbar();
    const { databaseLocalesOptions, uiLocalesOptions, saveLocaleStatus, changeLocale } =
        useUserSettings();

    useEffect(() => {
        if (saveLocaleStatus && saveLocaleStatus.status === "success") {
            snackbar.info(saveLocaleStatus.message);
        } else if (saveLocaleStatus && saveLocaleStatus.status === "error") {
            snackbar.error(saveLocaleStatus.message);
        }
    }, [snackbar, saveLocaleStatus]);

    const changeUserLocale = (
        e: ChangeEvent<{
            name?: string | undefined;
            value: unknown;
        }>,
        isUiLocale: boolean
    ) => {
        if (e.target.value && typeof e.target.value === "string") {
            changeLocale(isUiLocale, e.target.value);
        }
    };

    return (
        <ContentWrapper>
            <CustomCard title="User Settings">
                <InfoTable>
                    <tbody>
                        <tr>
                            <td>{i18n.t("Interface language")}</td>
                            <td>
                                <Select
                                    defaultValue={userInformation.settings.keyUiLocale}
                                    MenuProps={{ disableScrollLock: true }}
                                    onChange={e => changeUserLocale(e, true)}
                                >
                                    {uiLocalesOptions.map(option => (
                                        <MenuItem key={option.locale} value={option.locale}>
                                            {option.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </td>
                        </tr>
                        <tr>
                            <td>{i18n.t("Database language")}</td>
                            <td>
                                <Select
                                    defaultValue={userInformation.settings.keyDbLocale}
                                    MenuProps={{ disableScrollLock: true }}
                                    onChange={e => changeUserLocale(e, false)}
                                >
                                    {databaseLocalesOptions.map(option => (
                                        <MenuItem key={option.locale} value={option.locale}>
                                            {option.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </td>
                        </tr>
                        <tr>
                            <td>{i18n.t("Enable message email notifications")}</td>
                            <td>
                                <Select
                                    defaultValue={
                                        userInformation.settings.keyMessageEmailNotification
                                    }
                                    MenuProps={{ disableScrollLock: true }}
                                    disabled
                                >
                                    {booleanOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </td>
                        </tr>
                        <tr>
                            <td>{i18n.t("Enable message SMS notifications")}</td>
                            <td>
                                <Select
                                    defaultValue={
                                        userInformation.settings.keyMessageSmsNotification
                                    }
                                    MenuProps={{ disableScrollLock: true }}
                                    disabled
                                >
                                    {booleanOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </td>
                        </tr>
                    </tbody>
                </InfoTable>
            </CustomCard>
        </ContentWrapper>
    );
};

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 40px;
    max-width: 800px;
    p.intro {
        text-align: left;
        max-width: 730px;
        margin: 0 auto;
        font-weight: 300px;
        line-height: 1.4;
    }
`;

const InfoTable = styled.table`
    border: none;
    display: flex;
    justify-content: center;
    margin: 20px;
    tr {
        td {
            padding: 5px;
        }
        td:nth-child(1) {
            text-align: right;
        }
        td:nth-child(2) {
            font-weight: 600;
        }
    }
`;
