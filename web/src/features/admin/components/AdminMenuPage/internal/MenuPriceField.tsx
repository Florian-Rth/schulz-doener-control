import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { type FC, useState } from "react";
import { type UseFormReturn, useController } from "react-hook-form";
import { menuCopy } from "../../../copy";
import { centsToInput, inputToCents } from "../../../money";
import type { MenuItemForm } from "../../../types";

interface MenuPriceFieldProps {
  form: UseFormReturn<MenuItemForm>;
}

// Money input that displays a German "8,50" string while writing parsed integer
// cents into the RHF `priceCents` field. Bound via `useController` so the field
// stays subscribed to its own error state (the helper text repaints on submit).
// When the cents value changes from the outside (e.g. the edit dialog seeding an
// existing price) the display resyncs via a render-phase update — no useEffect,
// no commit-phase flicker. When the input is blanked or unparsable we write NaN
// (not the last valid value) so the Zod int/min(0) rule rejects it and the user
// cannot silently submit a stale price.
export const MenuPriceField: FC<MenuPriceFieldProps> = ({ form }) => {
  const { field, fieldState } = useController({ control: form.control, name: "priceCents" });
  const cents = field.value;

  const [display, setDisplay] = useState<string>(() => centsToInput(cents));
  const [lastCents, setLastCents] = useState<number>(cents);

  // Resync the visible string only when cents changed from the outside (e.g. the
  // edit dialog seeding an existing price), never while the user types. `Object.is`
  // so a NaN value (the user blanked the field) compares equal to itself and does
  // not loop. We skip the rewrite when the current display already parses to this
  // cents value — otherwise an in-progress entry like "8" would be clobbered to
  // "8,00" — and when cents is non-finite, which only comes from the user's own
  // invalid typing, so their raw text is kept and the Zod error can surface.
  if (!Object.is(cents, lastCents)) {
    setLastCents(cents);
    if (Number.isFinite(cents) && inputToCents(display) !== cents) {
      setDisplay(centsToInput(cents));
    }
  }

  return (
    <TextField
      label={menuCopy.priceLabel}
      placeholder={menuCopy.pricePlaceholder}
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
        htmlInput: { "aria-label": menuCopy.priceLabel },
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
