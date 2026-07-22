import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { FC } from "react";
import { Controller } from "react-hook-form";
import { MultiSelectChips, SegmentedControl, SelectChips } from "@/components";
import { orderCopy } from "../../../copy";
import { useOrderFormContext } from "../../../order-context";
import type { AnswerValue, Field } from "../../../types";
import { FieldError } from "./FieldError";
import { SectionLabel } from "./SectionLabel";

interface FieldRendererProps {
  field: Field;
  index: number;
}

// Generic control for one category field. Switches on field.type + field.display
// and binds to `lines.<index>.answers.<field.key>`. Every option label/icon comes
// from the server-provided field.options — never a hardcoded map. Answers are
// stored as { options: [...] } for selects and { text: "…" } for text fields.
export const FieldRenderer: FC<FieldRendererProps> = ({ field, index }) => {
  const { form, setAnswer } = useOrderFormContext();
  const name = `lines.${index}.answers.${field.key}` as const;
  const errorId = `${name}-error`;
  const selectOptions = field.options.map((option) => ({ value: option.key, label: option.label }));

  return (
    <Stack sx={{ gap: 1 }}>
      <SectionLabel
        label={field.label}
        hint={field.type === "multi" ? orderCopy.multiHint : undefined}
      />
      <Controller
        control={form.control}
        name={name}
        render={({ field: rhfField, fieldState }) => {
          const value: AnswerValue | undefined = rhfField.value;
          const single = value?.options?.[0] ?? null;

          if (field.type === "text") {
            return (
              <TextField
                value={value?.text ?? ""}
                onChange={(event) => {
                  setAnswer(index, field.key, { text: event.target.value });
                }}
                multiline
                minRows={2}
                error={fieldState.error !== undefined}
                helperText={fieldState.error?.message ?? " "}
                slotProps={{
                  htmlInput: {
                    "aria-label": field.label,
                    maxLength: field.maxLength ?? undefined,
                  },
                }}
              />
            );
          }

          if (field.type === "multi") {
            const chosen = value?.options ?? [];
            const options = field.options.map((option) => ({
              value: option.key,
              label: option.label,
              emoji: option.icon ?? undefined,
            }));
            return (
              <>
                <MultiSelectChips
                  options={options}
                  value={chosen}
                  onToggle={(optionKey: string) => {
                    const next = chosen.includes(optionKey)
                      ? chosen.filter((entry) => entry !== optionKey)
                      : [...chosen, optionKey];
                    setAnswer(index, field.key, { options: next });
                  }}
                />
                <FieldError error={fieldState.error} id={errorId} />
              </>
            );
          }

          // single-select — segmented / chips / dropdown
          const onPick = (optionKey: string): void => {
            setAnswer(index, field.key, { options: [optionKey] });
          };

          if (field.display === "dropdown") {
            return (
              <>
                <Select
                  value={single ?? ""}
                  displayEmpty
                  onChange={(event) => {
                    onPick(event.target.value);
                  }}
                  inputProps={{ "aria-label": field.label }}
                >
                  {selectOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                <FieldError error={fieldState.error} id={errorId} />
              </>
            );
          }

          if (field.display === "chips") {
            return (
              <>
                <SelectChips options={selectOptions} value={single} onChange={onPick} />
                <FieldError error={fieldState.error} id={errorId} />
              </>
            );
          }

          return (
            <>
              <SegmentedControl options={selectOptions} value={single} onChange={onPick} />
              <FieldError error={fieldState.error} id={errorId} />
            </>
          );
        }}
      />
    </Stack>
  );
};
