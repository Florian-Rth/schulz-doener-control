import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { fieldsCopy } from "../../../copy";
import type { AdminField, AdminFieldOption } from "../../../types";
import { FieldCard } from "./FieldCard";

interface FieldListProps {
  items: AdminField[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onEditField: (field: AdminField) => void;
  onDeleteField: (field: AdminField) => void;
  onAddOption: (field: AdminField) => void;
  onEditOption: (field: AdminField, option: AdminFieldOption) => void;
  onDeleteOption: (field: AdminField, option: AdminFieldOption) => void;
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

// Renders the field list with its loading / error / empty states. Presentational; delegates the
// field and option actions back to the page.
export const FieldList: FC<FieldListProps> = ({
  items,
  isLoading,
  isError,
  onEditField,
  onDeleteField,
  onAddOption,
  onEditOption,
  onDeleteOption,
}) => {
  if (isLoading) {
    return <Notice text={fieldsCopy.loading} />;
  }
  if (isError || items === undefined) {
    return <Notice text={fieldsCopy.loadError} isError />;
  }
  if (items.length === 0) {
    return <Notice text={fieldsCopy.empty} />;
  }

  return (
    <Stack sx={{ gap: 1.25 }}>
      {items.map((field) => (
        <FieldCard
          key={field.key}
          field={field}
          onEditField={() => onEditField(field)}
          onDeleteField={() => onDeleteField(field)}
          onAddOption={() => onAddOption(field)}
          onEditOption={(option) => onEditOption(field, option)}
          onDeleteOption={(option) => onDeleteOption(field, option)}
        />
      ))}
    </Stack>
  );
};
