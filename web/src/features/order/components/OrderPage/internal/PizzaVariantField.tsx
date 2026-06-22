import Stack from "@mui/material/Stack";
import type { FC } from "react";
import { Controller } from "react-hook-form";
import { SelectChips } from "@/components";
import { orderCopy } from "../../../copy";
import { useOrderFormContext, useOrderLineContext } from "../../../order-context";
import type { PizzaVariant } from "../../../types";
import { FieldError } from "./FieldError";
import { SectionLabel } from "./SectionLabel";

// Pizza-variant single-select for one line. Rendered only when pizzaVisible
// (render-phase gated by the parent). Binds the chip row to this line's variant.
export const PizzaVariantField: FC = () => {
  const { form, menu } = useOrderFormContext();
  const { index } = useOrderLineContext();
  const options = menu.pizzaVariants.map((variant) => ({ value: variant, label: variant }));
  const errorId = `lines.${index}.pizzaVariant-error`;

  return (
    <Stack sx={{ gap: 1 }}>
      <SectionLabel label={orderCopy.pizzaSection} />
      <Controller
        control={form.control}
        name={`lines.${index}.pizzaVariant`}
        render={({ field, fieldState }) => (
          <>
            <SelectChips
              options={options}
              value={field.value}
              onChange={(value: PizzaVariant) => {
                field.onChange(value);
              }}
            />
            <FieldError error={fieldState.error} id={errorId} />
          </>
        )}
      />
    </Stack>
  );
};
