import Stack from "@mui/material/Stack";
import type { FC } from "react";
import { Controller } from "react-hook-form";
import { SegmentedControl } from "@/components";
import { MEAT_LABELS, orderCopy } from "../../../copy";
import { useOrderFormContext } from "../../../order-context";
import type { MeatType } from "../../../types";
import { SectionLabel } from "./SectionLabel";

// Meat segmented control (Kalb | Hähnchen). Rendered only when meatVisible.
// Enum values stay ASCII; labels are the accented German display strings.
export const MeatField: FC = () => {
  const { form, menu } = useOrderFormContext();
  const options = menu.meatOptions.map((meat) => ({ value: meat, label: MEAT_LABELS[meat] }));

  return (
    <Stack sx={{ gap: 1 }}>
      <SectionLabel label={orderCopy.meatSection} />
      <Controller
        control={form.control}
        name="meat"
        render={({ field }) => (
          <SegmentedControl
            options={options}
            value={field.value}
            onChange={(value: MeatType) => {
              field.onChange(value);
            }}
          />
        )}
      />
    </Stack>
  );
};
