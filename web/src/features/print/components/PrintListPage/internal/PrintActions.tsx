import Stack from "@mui/material/Stack";
import type { FC } from "react";
import { GhostButton, PrimaryButton } from "@/components";
import { printCopy } from "../../../copy";
import { usePrintListContext } from "../../../print-context";

// Screen-only action bar: the red "Drucken" CTA (window.print) and the ghost
// back link. Marked data-print-hide so it never appears on the printed sheet.
export const PrintActions: FC = () => {
  const { print, goBack } = usePrintListContext();

  return (
    <Stack data-print-hide sx={{ gap: 1.25 }}>
      <PrimaryButton onClick={print} startIcon="print">
        {printCopy.print}
      </PrimaryButton>
      <GhostButton onClick={goBack}>{printCopy.back}</GhostButton>
    </Stack>
  );
};
