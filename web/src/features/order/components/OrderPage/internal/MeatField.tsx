import Stack from "@mui/material/Stack";
import type { FC } from "react";
import { Controller } from "react-hook-form";
import { SegmentedControl } from "@/components";
import { MEAT_LABELS, orderCopy } from "../../../copy";
import { useOrderFormContext, useOrderLineContext } from "../../../order-context";
import type { MeatType } from "../../../types";
import { FieldError } from "./FieldError";
import { SectionLabel } from "./SectionLabel";

// Meat segmented control (Kalb | Hähnchen) for one line. Rendered only when
// meatVisible. Enum values stay ASCII; labels are the accented German strings.
export const MeatField: FC = () => {
  const { form, menu } = useOrderFormContext();
  const { index } = useOrderLineContext();
  const options = menu.meatOptions.map((meat) => ({ value: meat, label: MEAT_LABELS[meat] }));
  const errorId = `lines.${index}.meat-error`;

  return (
    <Stack sx={{ gap: 1 }}>
      <SectionLabel label={orderCopy.meatSection} />
      <Controller
        control={form.control}
        name={`lines.${index}.meat`}
        render={({ field, fieldState }) => (
          <>
            <SegmentedControl
              options={options}
              value={field.value}
              onChange={(value: MeatType) => {
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
