import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { type FC, useState } from "react";
import { orderCopy } from "../../../copy";
import { centsToInput, inputToCents } from "../../../money";
import { useOrderFormContext } from "../../../order-context";
import { SectionLabel } from "./SectionLabel";

// Money input that displays a German "8,50" string while writing parsed integer
// cents into the RHF `priceCents` field. When the cents value changes from the
// outside (e.g. picking a product seeds its default price) the display string
// resyncs via a render-phase update — no useEffect, no commit-phase flicker.
export const PriceField: FC = () => {
  const { form } = useOrderFormContext();
  const cents = form.watch("priceCents");

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
        onChange={(event) => {
          const raw = event.target.value;
          setDisplay(raw);
          const parsed = inputToCents(raw);
          if (parsed !== null) {
            form.setValue("priceCents", parsed, { shouldValidate: true });
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
