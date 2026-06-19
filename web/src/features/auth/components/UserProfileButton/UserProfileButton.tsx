import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import type { SxProps, Theme } from "@mui/material/styles";
import type { FC } from "react";
import { Avatar, PushToast } from "@/components";
import { useAuth } from "../../auth-context";
import { authCopy } from "../../copy";
import { useProfileMenu } from "../../hooks/use-profile-menu";

interface UserProfileButtonProps {
  /** Avatar diameter in px. */
  size?: number;
  /** Parent-controlled positioning. */
  sx?: SxProps<Theme>;
}

// Profile menu behind the user avatar: an IconButton wrapping the Avatar that
// opens a Menu with "Passwort ändern" and "Abmelden". Reads the current user
// from the auth context; all actions live in `useProfileMenu`. Reusable on any
// authenticated header — sets no positioning margin of its own.
export const UserProfileButton: FC<UserProfileButtonProps> = ({ size = 38, sx }) => {
  const { user } = useAuth();
  const {
    anchorEl,
    isOpen,
    isLoggingOut,
    open,
    close,
    goToAdmin,
    goToChangePassword,
    logout,
    logoutError,
    dismissLogoutError,
  } = useProfileMenu();

  if (user === null) {
    return null;
  }

  const isAdmin = user.role.toLowerCase() === "admin";

  return (
    <>
      <IconButton
        onClick={open}
        aria-label={authCopy.profileMenuLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        sx={[{ p: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}
      >
        <Avatar displayName={user.displayName} colorHex={user.avatarColorHex} size={size} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={close}
        // Open below the avatar, right-aligned so it grows down-and-inward —
        // away from a top notch and inside the right safe-area on mobile.
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: (theme) => ({
              minWidth: 200,
              mt: 0.75,
              borderRadius: `${theme.radii.md}px`,
              // Respect device safe-area insets (e.g. landscape notch) so the
              // menu never tucks under the notch or home indicator.
              mr: "env(safe-area-inset-right, 0px)",
              mb: "env(safe-area-inset-bottom, 0px)",
            }),
          },
        }}
      >
        {isAdmin ? (
          <MenuItem onClick={goToAdmin} sx={{ fontWeight: 600 }}>
            {authCopy.adminArea}
          </MenuItem>
        ) : null}
        <MenuItem onClick={goToChangePassword} sx={{ fontWeight: 600 }}>
          {authCopy.changePassword}
        </MenuItem>
        <MenuItem
          onClick={logout}
          disabled={isLoggingOut}
          sx={{ fontWeight: 600, color: "primary.main" }}
        >
          {authCopy.logout}
        </MenuItem>
      </Menu>
      {logoutError !== null ? (
        <PushToast
          message={logoutError}
          onDismiss={dismissLogoutError}
          // Float over the header from a fixed anchor: this button sits inside a
          // header row, so a sticky toast would be clipped — pin it to the top of
          // the viewport, inside the safe-area inset.
          sx={{
            position: "fixed",
            top: "calc(env(safe-area-inset-top, 0px) + 8px)",
            left: 8,
            right: 8,
          }}
        />
      ) : null}
    </>
  );
};
