import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { IconChipBox } from "@/components";

interface InstallStepProps {
  index: number;
  text: string;
}

// A single numbered install step: the step number in a tinted tile + the instruction text. Pure UI.
export const InstallStep: FC<InstallStepProps> = ({ index, text }) => {
  return (
    <Stack direction="row" sx={{ gap: 1.5, alignItems: "center" }}>
      <IconChipBox tint="pink" size={4}>
        <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "primary.main" }}>
          {index}
        </Typography>
      </IconChipBox>
      <Typography sx={{ fontSize: "0.9375rem", color: "navy.main", lineHeight: 1.5 }}>
        {text}
      </Typography>
    </Stack>
  );
};
