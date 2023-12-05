import { useState } from "react";

export function useUserProfile() {
    const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    return {
        isChangePasswordDialogOpen,
        setIsChangePasswordDialogOpen,
        showPassword,
        setShowPassword,
        showConfirmPassword,
        setShowConfirmPassword,
        isLoading,
        setIsLoading,
    };
}
