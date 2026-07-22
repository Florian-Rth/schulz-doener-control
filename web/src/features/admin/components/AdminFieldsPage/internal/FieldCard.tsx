import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, isMaterialIconName, MaterialIcon } from "@/components";
import { fieldsCopy } from "../../../copy";
import { centsToInput } from "../../../money";
import { isReservedField, isReservedOption } from "../../../reserved";
import type { AdminField, AdminFieldOption } from "../../../types";
import { fieldDisplayLabel, fieldTypeLabel } from "./field-options";

interface FieldCardProps {
  field: AdminField;
  onEditField: () => void;
  onDeleteField: () => void;
  onAddOption: () => void;
  onEditOption: (option: AdminFieldOption) => void;
  onDeleteOption: (option: AdminFieldOption) => void;
}

const Badge: FC<{ label: string; tone: "neutral" | "muted" | "success" | "warning" }> = ({
  label,
  tone,
}) => {
  return (
    <Typography
      component="span"
      sx={(theme) => ({
        fontSize: "0.6875rem",
        fontWeight: 700,
        px: 1,
        py: 0.25,
        borderRadius: `${theme.radii.pill}px`,
        whiteSpace: "nowrap",
        ...(tone === "neutral"
          ? { backgroundColor: theme.palette.subtle.main, color: theme.palette.navy.main }
          : tone === "success"
            ? { backgroundColor: theme.ds.greenTint, color: theme.palette.success.main }
            : tone === "warning"
              ? { backgroundColor: theme.ds.orangeTint, color: theme.palette.warning.main }
              : { backgroundColor: theme.ds.inputBorder, color: theme.palette.muted.main }),
      })}
    >
      {label}
    </Typography>
  );
};

// Compact icon-only action, so a per-option row (icon + label + edit + delete) fits a narrow phone
// where two text buttons would overflow.
const IconAction: FC<{
  icon: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}> = ({ icon, label, disabled = false, onClick }) => {
  return (
    <ButtonBase
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      sx={(theme) => ({
        width: 32,
        height: 32,
        flexShrink: 0,
        borderRadius: `${theme.radii.sm}px`,
        border: `1.5px solid ${theme.ds.inputBorder}`,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <MaterialIcon name={icon} sx={{ fontSize: 18, color: "label.main" }} />
    </ButtonBase>
  );
};

const OptionIcon: FC<{ icon: string | null }> = ({ icon }) => {
  if (icon === null || icon === "") {
    return null;
  }
  if (isMaterialIconName(icon)) {
    return <MaterialIcon name={icon} sx={{ fontSize: 18, color: "primary.main" }} />;
  }
  return (
    <span aria-hidden style={{ fontSize: "1rem" }}>
      {icon}
    </span>
  );
};

// One field rendered as a card: its label, key, type/display badges, and the list of its options
// with per-option edit/delete. Reserved fields (meat/sauce) and reserved options render their delete
// action disabled with a locked hint; the Tier engine depends on them.
export const FieldCard: FC<FieldCardProps> = ({
  field,
  onEditField,
  onDeleteField,
  onAddOption,
  onEditOption,
  onDeleteOption,
}) => {
  const fieldLocked = isReservedField(field.key);

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
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.25 }}>
        <MaterialIcon name="tune" sx={{ fontSize: 24, color: "primary.main" }} />
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "navy.main" }}>
            {field.label}
          </Typography>
          <Typography sx={{ fontSize: "0.6875rem", color: "muted.main" }}>{field.key}</Typography>
        </Stack>
      </Stack>

      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
        <Badge label={fieldTypeLabel(field.type)} tone="neutral" />
        <Badge label={fieldDisplayLabel(field.display)} tone="neutral" />
        {fieldLocked ? <Badge label={fieldsCopy.reserved} tone="warning" /> : null}
      </Stack>

      {field.type !== "text" ? (
        <Stack
          sx={(theme) => ({ gap: 0.5, pt: 0.5, borderTop: `1px solid ${theme.ds.inputBorder}` })}
        >
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "label.main" }}>
            {fieldsCopy.optionsTitle}
          </Typography>
          {field.options.length === 0 ? (
            <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>
              {fieldsCopy.optionsEmpty}
            </Typography>
          ) : (
            field.options.map((option) => {
              const optionLocked = isReservedOption(field.key, option.key);
              return (
                <Stack
                  key={option.key}
                  direction="row"
                  sx={{
                    alignItems: "center",
                    gap: 1,
                    opacity: option.isAvailable ? 1 : 0.62,
                  }}
                >
                  <OptionIcon icon={option.icon} />
                  <Stack sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "navy.main" }}>
                      {option.label}
                    </Typography>
                    <Typography sx={{ fontSize: "0.6875rem", color: "muted.main" }}>
                      {option.key}
                      {option.priceDeltaCents > 0
                        ? ` · ${fieldsCopy.priceDeltaLabel(`${centsToInput(option.priceDeltaCents)} €`)}`
                        : ""}
                      {option.isAvailable ? "" : ` · ${fieldsCopy.unavailable}`}
                      {optionLocked ? ` · ${fieldsCopy.reserved}` : ""}
                    </Typography>
                  </Stack>
                  <IconAction
                    icon="edit"
                    label={`${fieldsCopy.actionEdit}: ${option.label}`}
                    onClick={() => onEditOption(option)}
                  />
                  <IconAction
                    icon="delete"
                    label={`${fieldsCopy.actionDelete}: ${option.label}`}
                    disabled={optionLocked}
                    onClick={() => onDeleteOption(option)}
                  />
                </Stack>
              );
            })
          )}
          <GhostButton
            startIcon="add"
            onClick={onAddOption}
            sx={{ mt: 0.5, py: 0.75, fontSize: "0.75rem" }}
          >
            {fieldsCopy.addOption}
          </GhostButton>
        </Stack>
      ) : null}

      {fieldLocked ? (
        <Typography sx={{ fontSize: "0.6875rem", color: "muted.main", fontStyle: "italic" }}>
          {fieldsCopy.reservedFieldHint}
        </Typography>
      ) : null}

      <Stack direction="row" sx={{ gap: 1, mt: 0.5, flexWrap: "wrap" }}>
        <GhostButton onClick={onEditField} sx={{ flex: 1, py: 1, fontSize: "0.8125rem" }}>
          {fieldsCopy.actionEdit}
        </GhostButton>
        <GhostButton
          onClick={onDeleteField}
          disabled={fieldLocked}
          sx={{ flex: 1, py: 1, fontSize: "0.8125rem" }}
        >
          {fieldsCopy.actionDelete}
        </GhostButton>
      </Stack>
    </Stack>
  );
};
