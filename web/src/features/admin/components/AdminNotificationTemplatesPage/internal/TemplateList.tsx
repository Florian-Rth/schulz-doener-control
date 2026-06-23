import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { templatesCopy } from "../../../copy";
import type { AdminNotificationTemplate } from "../../../types";
import { TemplateCard } from "./TemplateCard";

interface TemplateListProps {
  items: AdminNotificationTemplate[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onEdit: (template: AdminNotificationTemplate) => void;
  onDelete: (template: AdminNotificationTemplate) => void;
}

const Notice: FC<{ text: string; isError?: boolean }> = ({ text, isError }) => {
  return (
    <Typography
      role={isError === true ? "alert" : undefined}
      sx={{
        fontSize: "0.875rem",
        color: isError === true ? "primary.main" : "muted.main",
        textAlign: "center",
        py: 3,
      }}
    >
      {text}
    </Typography>
  );
};

// Renders the notification-text list with its loading / error / empty states. Presentational;
// delegates the row actions back to the page.
export const TemplateList: FC<TemplateListProps> = ({
  items,
  isLoading,
  isError,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return <Notice text={templatesCopy.loading} />;
  }
  if (isError || items === undefined) {
    return <Notice text={templatesCopy.loadError} isError />;
  }
  if (items.length === 0) {
    return <Notice text={templatesCopy.empty} />;
  }

  return (
    <Stack sx={{ gap: 1.25 }}>
      {items.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onEdit={() => onEdit(template)}
          onDelete={() => onDelete(template)}
        />
      ))}
    </Stack>
  );
};
