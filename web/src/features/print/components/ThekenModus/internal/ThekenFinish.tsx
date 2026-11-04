import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon } from "@/components";
import { pickLine } from "@/lib/funny-lines";
import { thekenCopy } from "../../../copy";
import { useThekenContext } from "../theken-context";

// The final screen once every order is read out.
export const ThekenFinish: FC = () => {
  const { seed } = useThekenContext();

  return (
    <Stack
      sx={{ flex: 1, minHeight: 0, px: 3, gap: 2, alignItems: "center", justifyContent: "center" }}
    >
      <MaterialIcon name="emoji_events" sx={{ fontSize: "6rem", color: "gold.main" }} />
      <Typography
        component="p"
        sx={{
          fontSize: "clamp(2rem, 9vw, 3.25rem)",
          fontWeight: 800,
          lineHeight: 1.1,
          textAlign: "center",
          color: "navy.contrastText",
        }}
      >
        {thekenCopy.finishTitle}
      </Typography>
      <Typography
        sx={{ fontSize: "1.0625rem", textAlign: "center", color: "rgba(255,255,255,.8)" }}
      >
        {pickLine(thekenCopy.finishLines, seed)}
      </Typography>
    </Stack>
  );
};
