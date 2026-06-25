import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, MaterialIcon } from "@/components";
import { pizzaVariantsCopy } from "../../../copy";
import type { AdminPizzaVariant } from "../../../types";

interface PizzaVariantCardProps {
  variant: AdminPizzaVariant;
  onEdit: () => void;
  onDelete: () => void;
}

// One pizza variant rendered as a mobile-first card: its symbol, name, the sort-order + status
// badges, and the row actions. Unavailable variants are visually dimmed. Presentational — actions
// are delegated to the page via callbacks.
export const PizzaVariantCard: FC<PizzaVariantCardProps> = ({ variant, onEdit, onDelete }) => {
  return (
    <Stack
      sx={(theme) => ({
        p: 1.75,
        gap: 1,
        borderRadius: `${theme.radii.lg}px`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: "0 1px 3px rgba(0,0,0,.10)",
        opacity: variant.isAvailable ? 1 : 0.62,
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.25 }}>
        <MaterialIcon
          name={variant.icon ?? "local_pizza"}
          sx={{ fontSize: 24, color: "primary.main" }}
        />
        <Typography
          sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "navy.main", flex: 1, minWidth: 0 }}
        >
          {variant.name}
        </Typography>
        <Typography
          component="span"
          sx={(theme) => ({
            fontSize: "0.6875rem",
            fontWeight: 700,
            px: 1,
            py: 0.25,
            borderRadius: `${theme.radii.pill}px`,
            whiteSpace: "nowrap",
            ...(variant.isAvailable
              ? { backgroundColor: theme.ds.greenTint, color: theme.palette.success.main }
              : { backgroundColor: theme.ds.inputBorder, color: theme.palette.muted.main }),
          })}
        >
          {variant.isAvailable ? pizzaVariantsCopy.available : pizzaVariantsCopy.unavailable}
        </Typography>
      </Stack>

      <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>
        {pizzaVariantsCopy.sortLabel(variant.sortOrder)}
      </Typography>

      <Stack direction="row" sx={{ gap: 1, mt: 0.5, flexWrap: "wrap" }}>
        <GhostButton onClick={onEdit} sx={{ flex: 1, py: 1, fontSize: "0.8125rem" }}>
          {pizzaVariantsCopy.actionEdit}
        </GhostButton>
        <GhostButton onClick={onDelete} sx={{ flex: 1, py: 1, fontSize: "0.8125rem" }}>
          {pizzaVariantsCopy.actionDelete}
        </GhostButton>
      </Stack>
    </Stack>
  );
};
