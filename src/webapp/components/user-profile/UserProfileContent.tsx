import i18n from "@eyeseetea/d2-ui-components/locales";
import styled from "styled-components";
import { CustomCard } from "../custom-card/CustomCard";

import Chip from "@material-ui/core/Chip";
import {
    Button,
    CircularProgress,
    DialogContent,
    FormControl,
    IconButton,
    Input,
    InputAdornment,
    InputLabel,
} from "@material-ui/core";
import { ConfirmationDialog, useSnackbar } from "@eyeseetea/d2-ui-components";
import { useEffect, useState } from "react";
import { Visibility, VisibilityOff } from "@material-ui/icons";
import { OrgUnitAccess, UserAttrs, UserRole } from "../../../domain/entities/User";
import { useSavePassword } from "./hooks/useSavePassword";

interface UserProfileContentProps {
    userInformation: UserAttrs;
}

export const UserProfileContent: React.FC<UserProfileContentProps> = ({ userInformation }) => {
    const snackbar = useSnackbar();
    const {
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        savePasswordStatus,
        savePassword,
    } = useSavePassword();
    const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (savePasswordStatus && savePasswordStatus.status === "success") {
            snackbar.info(savePasswordStatus.message);
            setIsChangePasswordDialogOpen(false);
            setIsLoading(false);
        } else if (savePasswordStatus && savePasswordStatus.status === "error") {
            snackbar.error(savePasswordStatus.message);
            setIsLoading(false);
        }
    }, [savePasswordStatus, snackbar]);

    const saveUserPassword = () => {
        if (password !== confirmPassword) {
            snackbar.error(i18n.t("The password and confirm password fields don't match"));
        } else {
            savePassword(password);
            setIsLoading(true);
        }
    };

    return (
        <ContentWrapper>
            <CustomCard title="User Profile">
                <InfoTable>
                    <tbody>
                        <tr>
                            <td>{i18n.t("Full name")}</td>
                            <td>{userInformation.name}</td>
                        </tr>
                        <tr>
                            <td>{i18n.t("Username")}</td>
                            <td>{userInformation.username}</td>
                        </tr>
                        <tr>
                            <td>{i18n.t("Email")}</td>
                            <td>{userInformation.email}</td>
                        </tr>
                        <tr>
                            <td>{i18n.t("Phone number")}</td>
                            <td>{userInformation.phoneNumber}</td>
                        </tr>
                        <tr>
                            <td>{i18n.t("Birthday")}</td>
                            <td>{userInformation.birthday}</td>
                        </tr>
                        <tr>
                            <td>{i18n.t("Nationality")}</td>
                            <td>{userInformation.nationality}</td>
                        </tr>
                        <tr>
                            <td>{i18n.t("Job title")}</td>
                            <td>{userInformation.jobTitle}</td>
                        </tr>
                        <tr>
                            <td>{i18n.t("Employer")}</td>
                            <td>{userInformation.employer}</td>
                        </tr>
                        <tr>
                            <td>{i18n.t("Education")}</td>
                            <td>{userInformation.education}</td>
                        </tr>
                        <tr>
                            <td>{i18n.t("Interests")}</td>
                            <td>{userInformation.interests}</td>
                        </tr>
                        <tr>
                            <td>{i18n.t("Languages")}</td>
                            <td>{userInformation.languages}</td>
                        </tr>
                    </tbody>
                </InfoTable>
                <StyledButton
                    onClick={() => setIsChangePasswordDialogOpen(true)}
                    variant="contained"
                    color="primary"
                >
                    {i18n.t("Change Password")}
                </StyledButton>
            </CustomCard>

            <CustomCard title="User Roles">
                <InfoTable>
                    <tbody>
                        <tr>
                            <td style={{ textAlign: "left" }}>
                                {userInformation.userRoles.map((roles: UserRole) => (
                                    <StyledChip
                                        key={roles.id}
                                        label={roles.name}
                                        color="primary"
                                        size="small"
                                    />
                                ))}
                            </td>
                        </tr>
                    </tbody>
                </InfoTable>
            </CustomCard>

            <CustomCard title="User Organisation Units">
                <InfoTable>
                    <tbody>
                        <tr>
                            <td style={{ textAlign: "left" }}>
                                {userInformation.userCountriesAccess.map(
                                    (orgUnits: OrgUnitAccess) => (
                                        <StyledChip
                                            size="small"
                                            key={orgUnits.orgUnitId}
                                            label={orgUnits.orgUnitName}
                                            color="primary"
                                        />
                                    )
                                )}
                            </td>
                        </tr>
                    </tbody>
                </InfoTable>
            </CustomCard>

            <ConfirmationDialog
                isOpen={isChangePasswordDialogOpen}
                title={i18n.t("Change password")}
                onSave={saveUserPassword}
                onCancel={() => setIsChangePasswordDialogOpen(false)}
                saveText={i18n.t("Change Password")}
                cancelText={i18n.t("Cancel")}
                fullWidth={true}
                disableEnforceFocus
            >
                <DialogContainer>
                    <FormControl variant="standard">
                        <InputLabel htmlFor="password">{i18n.t("New Password")}</InputLabel>
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            disabled={isLoading}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            }
                        />
                    </FormControl>
                    <FormControl variant="standard">
                        <InputLabel htmlFor="confirm-password">
                            {i18n.t("Confirm Password")}
                        </InputLabel>
                        <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            }
                        />
                    </FormControl>
                    {isLoading && <CircularProgress />}
                </DialogContainer>
            </ConfirmationDialog>
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

const StyledChip = styled(Chip)`
    margin: 5px 1px;
`;

const StyledButton = styled(Button)`
    margin: 10px 20px 20px auto;
    margin-left: auto;
    width: fit-content;
`;

const DialogContainer = styled(DialogContent)`
    display: flex;
    flex-direction: column;
    align-items: self-start;
    gap: 10px;
`;
