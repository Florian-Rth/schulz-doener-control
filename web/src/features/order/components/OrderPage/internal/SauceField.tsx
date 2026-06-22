import Stack from "@mui/material/Stack";
import type { FC } from "react";
import { Controller } from "react-hook-form";
import { MultiSelectChips } from "@/components";
import { orderCopy, SAUCE_LABELS } from "../../../copy";
import { useOrderFormContext, useOrderLineContext } from "../../../order-context";
import type { SauceType } from "../../../types";
import { FieldError } from "./FieldError";
import { SectionLabel } from "./SectionLabel";

// Sauce multi-select (Kräuter / Knoblauch / Scharf) for one line. Rendered only
// when meatVisible. Toggling accumulates / removes on this line's sauces array.
export const SauceField: FC = () => {
  const { form, menu } = useOrderFormContext();
  const { index } = useOrderLineContext();
  const options = menu.sauceOptions.map((sauce) => ({
    value: sauce,
    label: SAUCE_LABELS[sauce].label,
    emoji: SAUCE_LABELS[sauce].emoji,
  }));
  const errorId = `lines.${index}.sauces-error`;

  return (
    <Stack sx={{ gap: 1 }}>
      <SectionLabel label={orderCopy.sauceSection} hint={orderCopy.sauceHint} />
      <Controller
        control={form.control}
        name={`lines.${index}.sauces`}
        render={({ field, fieldState }) => (
          <>
            <MultiSelectChips
              options={options}
              value={field.value}
              onToggle={(value: SauceType) => {
                const next = field.value.includes(value)
                  ? field.value.filter((entry) => entry !== value)
                  : [...field.value, value];
                field.onChange(next);
              }}
            />
            <FieldError error={fieldState.error} id={errorId} />
          </>
        )}
      />
    </Stack>
  );
};
