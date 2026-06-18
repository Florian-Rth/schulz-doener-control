import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { FC } from "react";
import { Controller } from "react-hook-form";
import { orderCopy } from "../../../copy";
import { useOrderFormContext } from "../../../order-context";
import { SectionLabel } from "./SectionLabel";

// Free-text Extrawünsche field. Multiline. Binds to the RHF `extra` field.
export const ExtraField: FC = () => {
  const { form } = useOrderFormContext();

  return (
    <Stack sx={{ gap: 1 }}>
      <SectionLabel label={orderCopy.extraSection} />
      <Controller
        control={form.control}
        name="extra"
        render={({ field }) => (
          <TextField
            value={field.value ?? ""}
            onChange={field.onChange}
            multiline
            minRows={2}
            placeholder={orderCopy.extraPlaceholder}
            slotProps={{ htmlInput: { "aria-label": orderCopy.extraSection } }}
          />
        )}
      />
    </Stack>
  );
};
