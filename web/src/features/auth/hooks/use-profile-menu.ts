import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useLogout } from "../api";
import { useAuth } from "../auth-context";

interface UseProfileMenuResult {
  /** Element the Menu anchors to; `null` while the menu is closed. */
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  isLoggingOut: boolean;
  open: (event: React.MouseEvent<HTMLElement>) => void;
  close: () => void;
  /** Closes the menu and routes to the change-password page. */
  goToChangePassword: () => void;
  /**
   * Logs out, then — on success only — clears the cached session and routes to
   * /login. Clearing only in `onSuccess` avoids the logout race: wiping the
   * session before the `POST /api/auth/logout` resolves would let the guard
   * re-resolve mid-flight against an inconsistent state.
   */
  logout: () => void;
}

// Logic layer for the profile menu: owns the anchor state and the two actions.
// Holds no JSX; the UserProfileButton consumes this and renders.
export const useProfileMenu = (): UseProfileMenuResult => {
  const navigate = useNavigate();
  const { clear } = useAuth();
  const logoutMutation = useLogout();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const close = (): void => {
    setAnchorEl(null);
  };

  const goToChangePassword = (): void => {
    close();
    void navigate({ to: "/passwort-aendern" });
  };

  const logout = (): void => {
    close();
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        clear();
        void navigate({ to: "/login" });
      },
    });
  };

  return {
    anchorEl,
    isOpen: anchorEl !== null,
    isLoggingOut: logoutMutation.isPending,
    open: (event) => setAnchorEl(event.currentTarget),
    close,
    goToChangePassword,
    logout,
  };
};
