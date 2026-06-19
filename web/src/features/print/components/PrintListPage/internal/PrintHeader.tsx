import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { printCopy } from "../../../copy";
import { usePrintListContext } from "../../../print-context";

// The sheet header: "Döner-Tag {date}", the synonym + order-count subline and
// the "Abholer: {names}" line. Presentational — reads the derived strings from
// context. Stays black-on-white in print thanks to PrintStyles.
export const PrintHeader: FC = () => {
  const { title, subline, abholerNames } = usePrintListContext();

  return (
    <Stack
      sx={{
        gap: 0.5,
        pb: 1.5,
        borderBottom: "2px solid",
        borderColor: "navy.main",
      }}
    >
      <Typography
        variant="h1"
        component="h1"
        sx={{ fontSize: "1.375rem", fontWeight: 700, color: "navy.main" }}
      >
        {title}
      </Typography>
      <Typography sx={{ fontSize: "0.8125rem", color: "muted.main" }}>{subline}</Typography>
      {abholerNames !== "" ? (
        <Typography sx={{ fontSize: "0.9375rem", color: "navy.main", mt: 0.5 }}>
          <Typography component="b" sx={{ fontWeight: 700 }}>
            {printCopy.abholerLabel}
          </Typography>{" "}
          {abholerNames}
        </Typography>
      ) : null}
    </Stack>
  );
};
