import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { type FC, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { menuCopy } from "../../../copy";
import { centsToInput, inputToCents } from "../../../money";
import type { MenuItemForm } from "../../../types";

interface MenuPriceFieldProps {
  form: UseFormReturn<MenuItemForm>;
}

// Money input that displays a German "8,50" string while writing parsed integer
// cents into the RHF `priceCents` field. When cents changes from the outside
// (e.g. the edit dialog seeding an existing price) the display resyncs via a
// render-phase update — no useEffect, no commit-phase flicker.
export const MenuPriceField: FC<MenuPriceFieldProps> = ({ form }) => {
  const cents = form.watch("priceCents");
  const error = form.formState.errors.priceCents;

  const [display, setDisplay] = useState<string>(() => centsToInput(cents));
  const [lastCents, setLastCents] = useState<number>(cents);

  if (cents !== lastCents) {
    setLastCents(cents);
    setDisplay(centsToInput(cents));
  }

  return (
    <TextField
      label={menuCopy.priceLabel}
      placeholder={menuCopy.pricePlaceholder}
      value={display}
      inputMode="decimal"
      fullWidth
      error={error !== undefined}
      helperText={error?.message ?? " "}
      onChange={(event) => {
        const raw = event.target.value;
        setDisplay(raw);
        const parsed = inputToCents(raw);
        if (parsed !== null) {
          form.setValue("priceCents", parsed, { shouldValidate: true });
        }
      }}
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
