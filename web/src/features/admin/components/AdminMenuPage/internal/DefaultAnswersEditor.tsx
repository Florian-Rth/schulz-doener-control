import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { Controller, type UseFormReturn, useWatch } from "react-hook-form";
import { MultiSelectChips } from "@/components";
import { menuCopy } from "../../../copy";
import type { AdminCategory, AdminField, MenuItemForm } from "../../../types";

interface DefaultAnswersEditorProps {
  form: UseFormReturn<MenuItemForm>;
  categories: AdminCategory[];
  fields: AdminField[];
}

// Resolves the chosen category's field links (in order) to their full field
// definitions. Fields whose definition is missing (e.g. mid-migration) are
// skipped so the editor never renders a broken control.
const resolveFields = (
  categoryKey: string,
  categories: AdminCategory[],
  fields: AdminField[],
): AdminField[] => {
  const category = categories.find((entry) => entry.key === categoryKey);
  if (category === undefined) {
    return [];
  }
  return [...category.fields]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((link) => fields.find((field) => field.key === link.fieldKey))
    .filter((field): field is AdminField => field !== undefined);
};

// The default-answers editor for the menu dialog. Once a category is chosen it
// renders one control per category field (single→dropdown, multi→chips,
// text→textarea), writing the seed into the form's `defaultAnswers` map keyed by
// field key. Hidden entirely when no category is selected.
export const DefaultAnswersEditor: FC<DefaultAnswersEditorProps> = ({
  form,
  categories,
  fields,
}) => {
  const categoryKey = useWatch({ control: form.control, name: "categoryKey" });
  if (categoryKey === "") {
    return null;
  }
  const resolved = resolveFields(categoryKey, categories, fields);
  if (resolved.length === 0) {
    return null;
  }

  return (
    <Stack sx={{ gap: 1, pt: 0.5 }}>
      <Stack sx={{ gap: 0.25 }}>
        <Typography
          component="span"
          sx={{ fontSize: "0.75rem", fontWeight: 700, color: "label.main" }}
        >
          {menuCopy.defaultAnswersLabel}
        </Typography>
        <Typography sx={{ fontSize: "0.6875rem", color: "muted.main", lineHeight: 1.4 }}>
          {menuCopy.defaultAnswersHint}
        </Typography>
      </Stack>

      {resolved.map((field) => (
        <Controller
          key={field.key}
          control={form.control}
          name={`defaultAnswers.${field.key}` as const}
          render={({ field: rhfField }) => {
            const value = rhfField.value ?? {};

            if (field.type === "text") {
              return (
                <TextField
                  label={field.label}
                  value={value.text ?? ""}
                  onChange={(event) => {
                    rhfField.onChange({ text: event.target.value });
                  }}
                  multiline
                  minRows={2}
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: field.maxLength ?? undefined } }}
                />
              );
            }

            if (field.type === "multi") {
              const chosen = value.options ?? [];
              const options = field.options.map((option) => ({
                value: option.key,
                label: option.label,
                emoji: option.icon ?? undefined,
              }));
              return (
                <Stack sx={{ gap: 0.5 }}>
                  <Typography
                    component="span"
                    sx={{ fontSize: "0.75rem", fontWeight: 600, color: "label.main" }}
                  >
                    {field.label}
                  </Typography>
                  <MultiSelectChips
                    options={options}
                    value={chosen}
                    onToggle={(optionKey) => {
                      const next = chosen.includes(optionKey)
                        ? chosen.filter((entry) => entry !== optionKey)
                        : [...chosen, optionKey];
                      rhfField.onChange({ options: next });
                    }}
                  />
                </Stack>
              );
            }

            // single-select — a dropdown with an explicit "none" choice.
            const single = value.options?.[0] ?? "";
            return (
              <Stack sx={{ gap: 0.5 }}>
                <Typography
                  component="span"
                  sx={{ fontSize: "0.75rem", fontWeight: 600, color: "label.main" }}
                >
                  {field.label}
                </Typography>
                <Select
                  value={single}
                  displayEmpty
                  onChange={(event) => {
                    const next = event.target.value;
                    rhfField.onChange(next === "" ? {} : { options: [next] });
                  }}
                  inputProps={{ "aria-label": field.label }}
                >
                  <MenuItem value="">{menuCopy.answerNone}</MenuItem>
                  {field.options.map((option) => (
                    <MenuItem key={option.key} value={option.key}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            );
          }}
        />
      ))}
    </Stack>
  );
};
