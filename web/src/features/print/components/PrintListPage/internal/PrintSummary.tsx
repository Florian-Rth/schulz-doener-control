import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { printCopy } from "../../../copy";
import { usePrintListContext } from "../../../print-context";

// The "für die Theke" roll-up above the per-package list: identical items folded into "n× …" lines so
// the whole order can be read out at the counter quickly. Hidden when nothing has been ordered yet.
export const PrintSummary: FC = () => {
  const { summary } = usePrintListContext();

  if (summary.length === 0) {
    return null;
  }

  return (
    <Stack
      sx={(theme) => ({
        gap: 0.25,
        p: 1.5,
        borderRadius: `${theme.radii.lg}px`,
        backgroundColor: "rgba(0,34,48,.04)",
      })}
    >
      <Typography
        sx={{
          fontSize: "0.6875rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "muted.main",
        }}
      >
        {printCopy.summaryHeading}
      </Typography>
      {summary.map((group) => (
        <Typography
          key={group.label}
          sx={{ fontSize: "0.9375rem", fontWeight: 600, color: "navy.main" }}
        >
          {group.quantity}× {group.label}
        </Typography>
      ))}
      <Typography sx={{ fontSize: "0.6875rem", color: "muted.main", mt: 0.5 }}>
        {printCopy.summaryHint}
      </Typography>
    </Stack>
  );
};
