import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, MaterialIcon } from "@/components";
import { templatesCopy } from "../../../copy";
import type { AdminNotificationTemplate } from "../../../types";

interface TemplateCardProps {
  template: AdminNotificationTemplate;
  onEdit: () => void;
  onDelete: () => void;
}

// One notification text rendered as a mobile-first card: the themed synonym, the message body, an
// active/inactive badge, and the row actions. Inactive texts are visually dimmed. Presentational —
// actions are delegated to the page via callbacks.
export const TemplateCard: FC<TemplateCardProps> = ({ template, onEdit, onDelete }) => {
  return (
    <Stack
      sx={(theme) => ({
        p: 1.75,
        gap: 1,
        borderRadius: `${theme.radii.lg}px`,
        backgroundColor: theme.palette.background.paper,
        boxShadow: "0 1px 3px rgba(0,0,0,.10)",
        opacity: template.isActive ? 1 : 0.62,
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.25 }}>
        <MaterialIcon name="campaign" sx={{ fontSize: 24, color: "primary.main" }} />
        <Typography
          sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "navy.main", flex: 1, minWidth: 0 }}
        >
          {template.synonym}
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
            ...(template.isActive
              ? { backgroundColor: theme.ds.greenTint, color: theme.palette.success.main }
              : { backgroundColor: theme.ds.inputBorder, color: theme.palette.muted.main }),
          })}
        >
          {template.isActive ? templatesCopy.active : templatesCopy.inactive}
        </Typography>
      </Stack>

      <Typography sx={{ fontSize: "0.8125rem", color: "label.main", lineHeight: 1.45 }}>
        {template.body}
      </Typography>

      <Stack direction="row" sx={{ gap: 1, mt: 0.5, flexWrap: "wrap" }}>
        <GhostButton onClick={onEdit} sx={{ flex: 1, py: 1, fontSize: "0.8125rem" }}>
          {templatesCopy.actionEdit}
        </GhostButton>
        <GhostButton onClick={onDelete} sx={{ flex: 1, py: 1, fontSize: "0.8125rem" }}>
          {templatesCopy.actionDelete}
        </GhostButton>
      </Stack>
    </Stack>
  );
};
