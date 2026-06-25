import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useLogout } from "../api";
import { useAuth } from "../auth-context";
import { authCopy } from "../copy";

interface UseProfileMenuResult {
  /** Element the Menu anchors to; `null` while the menu is closed. */
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  isLoggingOut: boolean;
  open: (event: React.MouseEvent<HTMLElement>) => void;
  close: () => void;
  /** Closes the menu and routes to the settings hub. */
  goToSettings: () => void;
  /** Closes the menu and routes to the Döner-Tiere catalog. */
  goToTiere: () => void;
  /** Closes the menu and routes to the notification settings. */
  goToNotifications: () => void;
  /** Closes the menu and routes to the admin hub. */
  goToAdmin: () => void;
  /** Closes the menu and routes to the change-password page. */
  goToChangePassword: () => void;
  /** Closes the menu and routes to the Impressum (legal notice). */
  goToImpressum: () => void;
  /**
   * Logs out, then — on success only — clears the cached session and routes to
   * /login. Clearing only in `onSuccess` avoids the logout race: wiping the
   * session before the `POST /api/auth/logout` resolves would let the guard
   * re-resolve mid-flight against an inconsistent state. A failure surfaces a
   * German toast (`logoutError`) instead of silently doing nothing.
   */
  logout: () => void;
  /** German message when logout fails; `null` while there is none to show. */
  logoutError: string | null;
  /** Dismisses the logout-error toast. */
  dismissLogoutError: () => void;
}

// Logic layer for the profile menu: owns the anchor state and the two actions.
// Holds no JSX; the UserProfileButton consumes this and renders.
export const useProfileMenu = (): UseProfileMenuResult => {
  const navigate = useNavigate();
  const { clear } = useAuth();
  const logoutMutation = useLogout();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const close = (): void => {
    setAnchorEl(null);
  };

  const goToSettings = (): void => {
    close();
    void navigate({ to: "/einstellungen" });
  };

  const goToTiere = (): void => {
    close();
    void navigate({ to: "/tiere" });
  };

  const goToNotifications = (): void => {
    close();
    void navigate({ to: "/benachrichtigungen" });
  };

  const goToAdmin = (): void => {
    close();
    void navigate({ to: "/admin" });
  };

  const goToChangePassword = (): void => {
    close();
    void navigate({ to: "/passwort-aendern" });
  };

  const goToImpressum = (): void => {
    close();
    void navigate({ to: "/impressum" });
  };

  const logout = (): void => {
    close();
    setLogoutError(null);
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        clear();
        void navigate({ to: "/login" });
      },
      onError: () => {
        setLogoutError(authCopy.logoutFailed);
      },
    });
  };

  return {
    anchorEl,
    isOpen: anchorEl !== null,
    isLoggingOut: logoutMutation.isPending,
    open: (event) => setAnchorEl(event.currentTarget),
    close,
    goToSettings,
    goToTiere,
    goToNotifications,
    goToAdmin,
    goToChangePassword,
    goToImpressum,
    logout,
    logoutError,
    dismissLogoutError: () => {
      setLogoutError(null);
    },
  };
};
