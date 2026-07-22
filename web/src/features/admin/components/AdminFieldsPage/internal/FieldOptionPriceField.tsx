import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { type FC, useState } from "react";
import { type UseFormReturn, useController } from "react-hook-form";
import { fieldsCopy } from "../../../copy";
import { centsToInput, inputToCents } from "../../../money";
import type { FieldOptionForm } from "../../../types";

interface FieldOptionPriceFieldProps {
  form: UseFormReturn<FieldOptionForm>;
}

// Euro-delta input for an option's price surcharge. Displays a German "1,50" string while writing
// parsed integer cents into `priceDeltaCents`. Resyncs the visible string only when the cents value
// changes from the outside (edit dialog seeding), via a render-phase update — no useEffect. A blank
// or unparsable entry writes NaN so the Zod rule rejects it rather than silently keeping a stale
// value.
export const FieldOptionPriceField: FC<FieldOptionPriceFieldProps> = ({ form }) => {
  const { field, fieldState } = useController({ control: form.control, name: "priceDeltaCents" });
  const cents = field.value;

  const [display, setDisplay] = useState<string>(() => centsToInput(cents));
  const [lastCents, setLastCents] = useState<number>(cents);

  if (!Object.is(cents, lastCents)) {
    setLastCents(cents);
    if (Number.isFinite(cents) && inputToCents(display) !== cents) {
      setDisplay(centsToInput(cents));
    }
  }

  return (
    <TextField
      label={fieldsCopy.optionPriceLabel}
      value={display}
      inputMode="decimal"
      fullWidth
      error={fieldState.error !== undefined}
      helperText={fieldState.error?.message ?? " "}
      onChange={(event) => {
        const raw = event.target.value;
        setDisplay(raw);
        const parsed = inputToCents(raw);
        field.onChange(parsed ?? Number.NaN);
      }}
      onBlur={field.onBlur}
      slotProps={{
        htmlInput: { "aria-label": fieldsCopy.optionPriceLabel },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Typography sx={{ fontWeight: 700, color: "muted.main" }}>€</Typography>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};
