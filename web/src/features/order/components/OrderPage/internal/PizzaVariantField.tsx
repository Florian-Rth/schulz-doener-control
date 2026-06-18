import Stack from "@mui/material/Stack";
import type { FC } from "react";
import { Controller } from "react-hook-form";
import { SelectChips } from "@/components";
import { orderCopy } from "../../../copy";
import { useOrderFormContext } from "../../../order-context";
import type { PizzaVariant } from "../../../types";
import { SectionLabel } from "./SectionLabel";

// Pizza-variant single-select. Rendered only when pizzaVisible (render-phase
// gated by the parent). Binds the chip row to the RHF `pizzaVariant` field.
export const PizzaVariantField: FC = () => {
  const { form, menu } = useOrderFormContext();
  const options = menu.pizzaVariants.map((variant) => ({ value: variant, label: variant }));

  return (
    <Stack sx={{ gap: 1 }}>
      <SectionLabel label={orderCopy.pizzaSection} />
      <Controller
        control={form.control}
        name="pizzaVariant"
        render={({ field }) => (
          <SelectChips
            options={options}
            value={field.value}
            onChange={(value: PizzaVariant) => {
              field.onChange(value);
            }}
          />
        )}
      />
    </Stack>
  );
};
