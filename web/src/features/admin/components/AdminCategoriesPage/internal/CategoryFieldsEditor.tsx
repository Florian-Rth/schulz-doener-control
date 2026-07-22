import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon, PrimaryButton, Toggle } from "@/components";
import { categoriesCopy } from "../../../copy";
import { useCategoryFieldsEditor } from "../../../hooks/use-category-fields-editor";
import type { AdminCategory } from "../../../types";

interface CategoryFieldsEditorProps {
  category: AdminCategory;
}

interface MoveButtonProps {
  icon: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
}

const MoveButton: FC<MoveButtonProps> = ({ icon, label, disabled, onClick }) => {
  return (
    <ButtonBase
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      sx={(theme) => ({
        width: 34,
        height: 34,
        borderRadius: `${theme.radii.sm}px`,
        border: `1.5px solid ${theme.ds.inputBorder}`,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <MaterialIcon name={icon} sx={{ fontSize: 20, color: "label.main" }} />
    </ButtonBase>
  );
};

// The field-assignment editor inside the category edit dialog. Lets the admin pick which fields the
// category exposes, toggle each field's required flag, and reorder them; saving replaces the whole
// link set. Logic lives in `useCategoryFieldsEditor`.
export const CategoryFieldsEditor: FC<CategoryFieldsEditorProps> = ({ category }) => {
  const {
    assigned,
    available,
    isLoading,
    isSaving,
    saved,
    serverError,
    add,
    remove,
    setRequired,
    moveUp,
    moveDown,
    save,
  } = useCategoryFieldsEditor(category);

  const hasAnyField = !isLoading && (assigned.length > 0 || available.length > 0);

  return (
    <Stack sx={(theme) => ({ gap: 1, pt: 1, borderTop: `1px solid ${theme.ds.inputBorder}` })}>
      <Stack sx={{ gap: 0.25 }}>
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "navy.main" }}>
          {categoriesCopy.fieldsSectionTitle}
        </Typography>
        <Typography sx={{ fontSize: "0.6875rem", color: "muted.main", lineHeight: 1.4 }}>
          {categoriesCopy.fieldsSectionHint}
        </Typography>
      </Stack>

      {!hasAnyField ? (
        <Typography sx={{ fontSize: "0.8125rem", color: "muted.main", py: 1 }}>
          {categoriesCopy.fieldsEmpty}
        </Typography>
      ) : null}

      {assigned.map((entry, index) => (
        <Stack
          key={entry.field.key}
          sx={(theme) => ({
            gap: 0.75,
            p: 1,
            borderRadius: `${theme.radii.md}px`,
            border: `1.5px solid ${theme.ds.inputBorder}`,
          })}
        >
          <Stack sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: "navy.main" }}>
              {entry.field.label}
            </Typography>
            <Typography sx={{ fontSize: "0.6875rem", color: "muted.main" }}>
              {entry.field.key}
            </Typography>
          </Stack>
          {/* Controls sit under the label and wrap, so the row never overflows a narrow phone. */}
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              gap: 0.5,
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
              <Typography sx={{ fontSize: "0.6875rem", fontWeight: 600, color: "label.main" }}>
                {categoriesCopy.requiredLabel}
              </Typography>
              <Toggle
                checked={entry.isRequired}
                onChange={(checked) => setRequired(entry.field.key, checked)}
                ariaLabel={`${categoriesCopy.requiredLabel} ${entry.field.label}`}
              />
            </Stack>
            <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
              <MoveButton
                icon="arrow_upward"
                label={`${categoriesCopy.moveUp} ${entry.field.label}`}
                disabled={index === 0}
                onClick={() => moveUp(index)}
              />
              <MoveButton
                icon="arrow_downward"
                label={`${categoriesCopy.moveDown} ${entry.field.label}`}
                disabled={index === assigned.length - 1}
                onClick={() => moveDown(index)}
              />
              <ButtonBase
                aria-label={`${categoriesCopy.actionDelete} ${entry.field.label}`}
                onClick={() => remove(entry.field.key)}
                sx={(theme) => ({
                  width: 34,
                  height: 34,
                  borderRadius: `${theme.radii.sm}px`,
                  border: `1.5px solid ${theme.ds.inputBorder}`,
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <MaterialIcon name="close" sx={{ fontSize: 20, color: "primary.main" }} />
              </ButtonBase>
            </Stack>
          </Stack>
        </Stack>
      ))}

      {available.length > 0 ? (
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mt: 0.5 }}>
          {available.map((field) => (
            <ButtonBase
              key={field.key}
              onClick={() => add(field.key)}
              sx={(theme) => ({
                py: 0.75,
                px: 1.25,
                gap: 0.5,
                borderRadius: `${theme.radii.pill}px`,
                border: `1.5px solid ${theme.ds.inputBorder}`,
                fontSize: "0.75rem",
                fontWeight: 600,
                color: theme.palette.label.main,
              })}
            >
              <MaterialIcon name="add" sx={{ fontSize: 16, color: "label.main" }} />
              {field.label}
            </ButtonBase>
          ))}
        </Stack>
      ) : null}

      {serverError !== null ? (
        <Typography
          role="alert"
          sx={{ fontSize: "0.8125rem", color: "primary.main", fontWeight: 600, mt: 0.5 }}
        >
          {serverError}
        </Typography>
      ) : null}
      {saved ? (
        <Typography sx={{ fontSize: "0.8125rem", color: "success.main", fontWeight: 600, mt: 0.5 }}>
          {categoriesCopy.fieldsSaved}
        </Typography>
      ) : null}

      <PrimaryButton onClick={save} loading={isSaving} sx={{ mt: 0.5 }}>
        {isSaving ? categoriesCopy.fieldsSaving : categoriesCopy.fieldsSave}
      </PrimaryButton>
    </Stack>
  );
};
