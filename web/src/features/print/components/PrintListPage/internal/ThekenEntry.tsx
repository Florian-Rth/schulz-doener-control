import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon } from "@/components";
import { pickLine } from "@/lib/funny-lines";
import { thekenCopy } from "../../../copy";
import { usePrintListContext } from "../../../print-context";
import { ThekenModus } from "../../ThekenModus";

// The prominent navy "Theken-Modus" card above the sheet (screen only) plus the
// full-screen counter mode it opens.
export const ThekenEntry: FC = () => {
  const { lines, thekenOpen, openTheken, closeTheken, pageSeed } = usePrintListContext();

  return (
    <>
      <ButtonBase
        data-print-hide
        onClick={openTheken}
        sx={(theme) => ({
          width: "100%",
          justifyContent: "flex-start",
          textAlign: "left",
          gap: 1.75,
          p: 2,
          borderRadius: `${theme.radii.xl}px`,
          backgroundColor: "navy.main",
          color: "navy.contrastText",
          boxShadow: "0 6px 16px rgba(0,34,48,.25)",
        })}
      >
        <Stack
          sx={(theme) => ({
            width: 48,
            height: 48,
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: `${theme.radii.md}px`,
            backgroundColor: "primary.main",
          })}
        >
          <MaterialIcon name="campaign" sx={{ fontSize: 28, color: "primary.contrastText" }} />
        </Stack>
        <Stack sx={{ flex: 1, minWidth: 0, gap: 0.25 }}>
          <Typography component="span" sx={{ fontSize: "1.0625rem", fontWeight: 700 }}>
            {thekenCopy.entry}
          </Typography>
          <Typography component="span" sx={{ fontSize: "0.8125rem", opacity: 0.8 }}>
            {pickLine(thekenCopy.entryHints, pageSeed)}
          </Typography>
        </Stack>
        <MaterialIcon name="chevron_right" sx={{ fontSize: 26 }} />
      </ButtonBase>
      <ThekenModus lines={lines} open={thekenOpen} onClose={closeTheken} />
    </>
  );
};
