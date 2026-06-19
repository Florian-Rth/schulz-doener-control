import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { FC, ReactNode } from "react";
import { GhostButton } from "@/components";
import { usersCopy } from "../../../copy";
import type { AdminUser } from "../../../types";

interface UserCardProps {
  user: AdminUser;
  onEdit: () => void;
  onReset: () => void;
  onDeactivate: () => void;
}

interface StatusBadgeProps {
  label: string;
  sx: SxProps<Theme>;
}

const StatusBadge: FC<StatusBadgeProps> = ({ label, sx }) => {
  return (
    <Typography
      component="span"
      sx={[
        (theme) => ({
          fontSize: "0.6875rem",
          fontWeight: 700,
          px: 1,
          py: 0.25,
          borderRadius: `${theme.radii.pill}px`,
          whiteSpace: "nowrap",
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {label}
    </Typography>
  );
};

// One user row rendered as a mobile-first card: name + username, status badges
// (role, active state, forced password change) and the row actions. Presentational
// — all actions are delegated to the page via callbacks.
export const UserCard: FC<UserCardProps> = ({ user, onEdit, onReset, onDeactivate }) => {
  const badges: ReactNode[] = [
    <StatusBadge
      key="role"
      label={user.role === "Admin" ? usersCopy.roleAdmin : usersCopy.roleEmployee}
      sx={(theme) =>
        user.role === "Admin"
          ? {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
            }
          : { backgroundColor: theme.palette.subtle.main, color: theme.palette.navy.main }
      }
    />,
    <StatusBadge
      key="active"
      label={user.isActive ? usersCopy.active : usersCopy.inactive}
      sx={(theme) =>
        user.isActive
          ? { backgroundColor: theme.ds.greenTint, color: theme.palette.success.main }
          : { backgroundColor: theme.ds.inputBorder, color: theme.palette.muted.main }
      }
    />,
  ];
  if (user.mustChangePassword) {
    badges.push(
      <StatusBadge
        key="mustChange"
        label={usersCopy.mustChange}
        sx={(theme) => ({
          backgroundColor: theme.ds.orangeTint,
          color: theme.palette.warning.main,
        })}
      />,
    );
  }

  return (
    <Stack
      sx={(theme) => ({
        p: 1.75,
        gap: 1,
        borderRadius: `${theme.radii.lg}px`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: "0 1px 3px rgba(0,0,0,.10)",
      })}
    >
      <Stack sx={{ gap: 0.25 }}>
        <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "navy.main" }}>
          {user.displayName}
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>@{user.username}</Typography>
      </Stack>

      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
        {badges}
      </Stack>

      <Stack direction="row" sx={{ gap: 1, mt: 0.5, flexWrap: "wrap" }}>
        <GhostButton onClick={onEdit} sx={{ flex: 1, py: 1, fontSize: "0.8125rem" }}>
          {usersCopy.actionEdit}
        </GhostButton>
        <GhostButton onClick={onReset} sx={{ flex: 1, py: 1, fontSize: "0.8125rem" }}>
          {usersCopy.actionReset}
        </GhostButton>
        {user.isActive ? (
          <GhostButton onClick={onDeactivate} sx={{ flex: 1, py: 1, fontSize: "0.8125rem" }}>
            {usersCopy.actionDeactivate}
          </GhostButton>
        ) : null}
      </Stack>
    </Stack>
  );
};
