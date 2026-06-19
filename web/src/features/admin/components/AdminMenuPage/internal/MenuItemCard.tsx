import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { FC, ReactNode } from "react";
import { GhostButton, MaterialIcon } from "@/components";
import { menuCopy } from "../../../copy";
import type { AdminMenuItem } from "../../../types";

interface MenuItemCardProps {
  item: AdminMenuItem;
  onEdit: () => void;
  onDelete: () => void;
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

// One menu item rendered as a mobile-first card: icon + name + price, the kind
// and availability/insider badges, and the row actions. Retired (unavailable)
// items are clearly marked and visually dimmed. Presentational — actions are
// delegated to the page via callbacks.
export const MenuItemCard: FC<MenuItemCardProps> = ({ item, onEdit, onDelete }) => {
  const badges: ReactNode[] = [
    <StatusBadge
      key="kind"
      label={item.kind === "pizza" ? menuCopy.kindPizza : menuCopy.kindDoener}
      sx={(theme) => ({
        backgroundColor: theme.palette.subtle.main,
        color: theme.palette.navy.main,
      })}
    />,
    <StatusBadge
      key="available"
      label={item.isAvailable ? menuCopy.available : menuCopy.retired}
      sx={(theme) =>
        item.isAvailable
          ? { backgroundColor: theme.ds.greenTint, color: theme.palette.success.main }
          : { backgroundColor: theme.ds.inputBorder, color: theme.palette.muted.main }
      }
    />,
  ];
  if (item.isInsider) {
    badges.push(
      <StatusBadge
        key="insider"
        label={menuCopy.insider}
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
        opacity: item.isAvailable ? 1 : 0.62,
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.25 }}>
        <MaterialIcon name={item.materialIcon} sx={{ fontSize: 26, color: "primary.main" }} />
        <Stack sx={{ gap: 0.25, flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "navy.main" }}>
            {item.name}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>
            {item.defaultPriceLabel} · {menuCopy.sortLabel(item.sortOrder)}
          </Typography>
        </Stack>
      </Stack>

      {item.note !== null ? (
        <Typography sx={{ fontSize: "0.75rem", color: "muted.main", fontStyle: "italic" }}>
          {item.note}
        </Typography>
      ) : null}

      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
        {badges}
      </Stack>

      <Stack direction="row" sx={{ gap: 1, mt: 0.5, flexWrap: "wrap" }}>
        <GhostButton onClick={onEdit} sx={{ flex: 1, py: 1, fontSize: "0.8125rem" }}>
          {menuCopy.actionEdit}
        </GhostButton>
        <GhostButton onClick={onDelete} sx={{ flex: 1, py: 1, fontSize: "0.8125rem" }}>
          {menuCopy.actionDelete}
        </GhostButton>
      </Stack>
    </Stack>
  );
};
