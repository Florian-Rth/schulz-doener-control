import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { type FC, useState } from "react";
import { useFormState, useWatch } from "react-hook-form";
import { orderCopy } from "../../../copy";
import { centsToInput, inputToCents } from "../../../money";
import { useOrderFormContext, useOrderLineContext } from "../../../order-context";
import { SectionLabel } from "./SectionLabel";

// Per-line money input that displays a German "8,50" string while writing parsed
// integer cents into this line's `priceCents`. When the cents value changes from
// the outside (picking a product seeds its default price) the display string
// resyncs via a render-phase update — no useEffect, no commit-phase flicker.
export const PriceField: FC = () => {
  const { form } = useOrderFormContext();
  const { index } = useOrderLineContext();
  const cents = useWatch({ control: form.control, name: `lines.${index}.priceCents` });
  // Subscribe to this line's price error so the message renders on a blocked submit.
  const { errors } = useFormState({ control: form.control, name: `lines.${index}.priceCents` });
  const fieldError = errors.lines?.[index]?.priceCents;

  const [display, setDisplay] = useState<string>(() => centsToInput(cents));
  const [lastCents, setLastCents] = useState<number>(cents);

  if (cents !== lastCents) {
    setLastCents(cents);
    setDisplay(centsToInput(cents));
  }

  return (
    <Stack sx={{ gap: 1 }}>
      <SectionLabel label={orderCopy.priceSection} />
      <TextField
        value={display}
        inputMode="decimal"
        error={fieldError !== undefined}
        helperText={fieldError?.message ?? " "}
        onChange={(event) => {
          const raw = event.target.value;
          setDisplay(raw);
          const parsed = inputToCents(raw);
          if (parsed !== null) {
            form.setValue(`lines.${index}.priceCents`, parsed, { shouldValidate: true });
          }
        }}
        slotProps={{
          htmlInput: {
            "aria-label": orderCopy.priceSection,
            style: { fontWeight: 700, fontSize: "1rem" },
          },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Typography sx={{ fontWeight: 700, color: "muted.main" }}>€</Typography>
              </InputAdornment>
            ),
          },
        }}
      />
    </Stack>
  );
};
