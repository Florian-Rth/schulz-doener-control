import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, MaterialIcon } from "@/components";
import { categoriesCopy } from "../../../copy";
import type { AdminCategory } from "../../../types";

interface CategoryCardProps {
  category: AdminCategory;
  onEdit: () => void;
  onDelete: () => void;
}

// One category rendered as a mobile-first card: its icon, name, key, the assigned-field count, and
// the sort-order + status badges. Unavailable categories are dimmed. Presentational.
export const CategoryCard: FC<CategoryCardProps> = ({ category, onEdit, onDelete }) => {
  return (
    <Stack
      sx={(theme) => ({
        p: 1.75,
        gap: 1,
        borderRadius: `${theme.radii.lg}px`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: "0 1px 3px rgba(0,0,0,.10)",
        opacity: category.isAvailable ? 1 : 0.62,
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.25 }}>
        <MaterialIcon name="category" sx={{ fontSize: 24, color: "primary.main" }} />
        <Typography
          sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "navy.main", flex: 1, minWidth: 0 }}
        >
          {category.name}
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
            ...(category.isAvailable
              ? { backgroundColor: theme.ds.greenTint, color: theme.palette.success.main }
              : { backgroundColor: theme.ds.inputBorder, color: theme.palette.muted.main }),
          })}
        >
          {category.isAvailable ? categoriesCopy.available : categoriesCopy.unavailable}
        </Typography>
      </Stack>

      <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>
        {categoriesCopy.keyLabelShort(category.key)} ·{" "}
        {categoriesCopy.sortLabel(category.sortOrder)} ·{" "}
        {categoriesCopy.fieldsCount(category.fields.length)}
      </Typography>

      <Stack direction="row" sx={{ gap: 1, mt: 0.5, flexWrap: "wrap" }}>
        <GhostButton onClick={onEdit} sx={{ flex: 1, py: 1, fontSize: "0.8125rem" }}>
          {categoriesCopy.actionEdit}
        </GhostButton>
        <GhostButton onClick={onDelete} sx={{ flex: 1, py: 1, fontSize: "0.8125rem" }}>
          {categoriesCopy.actionDelete}
        </GhostButton>
      </Stack>
    </Stack>
  );
};
