import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { Controller } from "react-hook-form";
import { MaterialIcon } from "@/components";
import { orderCopy } from "../../../copy";
import { useOrderFormContext, useOrderLineContext } from "../../../order-context";
import { FieldError } from "./FieldError";
import { SectionLabel } from "./SectionLabel";

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 20;

// Per-line quantity stepper (1..20). Two icon buttons flank the live count and
// clamp it to the valid range; binds to this line's `quantity` field.
export const QuantityField: FC = () => {
  const { form } = useOrderFormContext();
  const { index } = useOrderLineContext();
  const errorId = `lines.${index}.quantity-error`;

  return (
    <Stack sx={{ gap: 1 }}>
      <SectionLabel label={orderCopy.quantitySection} />
      <Controller
        control={form.control}
        name={`lines.${index}.quantity`}
        render={({ field, fieldState }) => (
          <>
            <Stack
              direction="row"
              sx={(theme) => ({
                alignItems: "center",
                alignSelf: "flex-start",
                gap: 1.5,
                backgroundColor: theme.palette.background.paper,
                borderRadius: `${theme.radii.md}px`,
                boxShadow: "0 1px 3px rgba(0,0,0,.10)",
                p: 0.5,
              })}
            >
              <IconButton
                aria-label="Menge verringern"
                disabled={field.value <= MIN_QUANTITY}
                onClick={() => {
                  field.onChange(Math.max(MIN_QUANTITY, field.value - 1));
                }}
              >
                <MaterialIcon name="remove" sx={{ fontSize: 20, color: "navy.main" }} />
              </IconButton>
              <Typography
                aria-label={orderCopy.quantitySection}
                sx={{
                  minWidth: "1.5rem",
                  textAlign: "center",
                  fontWeight: 700,
                  color: "navy.main",
                }}
              >
                {field.value}
              </Typography>
              <IconButton
                aria-label="Menge erhöhen"
                disabled={field.value >= MAX_QUANTITY}
                onClick={() => {
                  field.onChange(Math.min(MAX_QUANTITY, field.value + 1));
                }}
              >
                <MaterialIcon name="add" sx={{ fontSize: 20, color: "navy.main" }} />
              </IconButton>
            </Stack>
            <FieldError error={fieldState.error} id={errorId} />
          </>
        )}
      />
    </Stack>
  );
};
